if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressErrors = require("./utils/ExpressErrors.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const Reviews = require("./models/review.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const bodyParser = require('body-parser');

//router objects;
const listings = require("./routes/listing.js");
const user = require("./models/user.js");
const { isLoggedIn, isReviewAuthor } = require("./middleware.js");
const {
  generateAndSendOtp,
  verifyOtp,
  sendBookingConfirmationEmail,
} = require("./MailService/nodeMailer.js");
// const review = require("./routes/review.js");
// const user = require("./routes/user.js");

// const MONGO_URL = "mongodb://127.0.0.1:27017/easeRentals";
const dbURL = process.env.ATLAS_DB_URL;

main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbURL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));
app.use(bodyParser.urlencoded({ extended: true }));
//mongo store
const store = MongoStore.create({
  mongoUrl: dbURL,
  crypto: {
    secret: process.env.SECRET,
  },
  tocuhAfter: 24 * 3600,
});

store.on("error", () => {
  console.log("ERROR IN MONGO STORE", err);
});

//Sessions
const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000, // day * hrs * mins * sec * milisecond
    httpOnly: true, // prevents client side js from accessing cookies
  },
};

app.use(session(sessionOptions));
app.use(flash()); //always use it before routes as it needs routes for working

//authentication //use it after session as passpot(lib or express) uses session to keep the track of user login
app.use(passport.initialize());
app.use(passport.session()); //this is used keep the user different sessions logged in
passport.use(new LocalStrategy(User.authenticate())); // use static authentication method of model in LocalStrategy

passport.serializeUser(User.serializeUser()); // to store users info in a session
passport.deserializeUser(User.deserializeUser()); // to unstore the users info from a session

//middleware for cookies
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currtUser = req.user;
  next();
});

//home route
app.get("/", (req, res) => {
  res.redirect("/listings");
});

//validate review
const validateReview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body);
  if (error) {
    console.log(error);
    let errMsg = error.detail.map((el) => el.message).join(",");
    throw new ExpressErrors(404, errMsg);
  } else {
    next();
  }
};

//router  //belongs to ln 70-73
app.use("/listings", listings); // router methode
// app.use("/listings/:id/reviews", review) // router method
// app.use("/users", user); // router method

//Reviews
// POST review route
app.post(
  "/listings/:id/reviews",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Reviews(req.body.review);
    newReview.author = req.user._id;
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    req.flash("success", "Review Posted Successfully!");
    res.redirect(`/listings/${listing._id}`);
  })
);

//Delete review Route
app.delete(
  "/listings/:id/reviews/:reviewId",
  isLoggedIn,
  isReviewAuthor,
  wrapAsync(async (req, res) => {
    let { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Reviews.findByIdAndDelete(reviewId);
    req.flash("success", "Review Deleted Scuccessfully!");
    res.redirect(`/listings/${id}`);
  })
);

//privacy and terms
app.get("/privacy", (req, res) => {
  res.render("includes/privacy.ejs");
});

app.get("/terms", (req, res) => {
  res.render("includes/terms.ejs");
});

//signup
app.get("/signup", (req, res) => {
  res.render("listings/signup.ejs");
});

app.post("/signup", async (req, res) => {
  try {
    let { username, password, email } = req.body;
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome to EaseRentals");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
});

//login
app.get("/login", (req, res) => {
  res.render("listings/login.ejs");
  //username test, pass- 12345
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  async (req, res) => {
    req.flash("success", "Welcome to EaseRentals");
    res.redirect("/listings");
  }
);

//logout
app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "User logged Out Successfully! ");
    res.redirect("/listings");
  });
});
app.use(express.json());

app.post("/sendMail", (req, res) => {
  const userMail = req.body.mail;
  // console.log(`Connection established! sending otp to mail : `);
  // console.log(userMail)
  generateAndSendOtp(userMail);
  res.status(200).json({ message: "Connection successful!" });
});
app.post("/verifyOtp", (req, res) => {
  const userOtp = req.body.otp;

  verifyOtp(userOtp, res)
    .then((response) => {
      console.log("Response sent:", response.statusCode, response.message);
    })
    .catch((error) => {
      console.error("Error during OTP verification:", error);
    });
});

//jo save karna h info uska code likh diyo
//buy route
app.post(
  "/buy",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    console.log("rent this listing button clicked")
    res.render("listings/buy.ejs");
  })
);
app.post(
  "/booked",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const email = req.body.buyer.email;
    const name = req.body.buyer.name;
    const phone = req.body.buyer.phone;
    const bookingDate = req.body.booking.date;

    sendBookingConfirmationEmail(email, name, phone, bookingDate);
  
    // Now you can use this data, e.g., save it to the database or render a response
    console.log(`Email: ${email}, Name: ${name}, Phone: ${phone}, Booking Date: ${bookingDate}`);
    res.render("listings/booked.ejs");
  })
);

//middleware
app.all("*", (req, res, next) => {
  next(new ExpressErrors(404, "Page not found!"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "something went wrong" } = err;
  // res.render("error.ejs");
  res.status(statusCode).render("listings/error.ejs", { err });
});

app.listen(process.env.PORT || 8080, () => {
  console.log("Server is running on port 8080");
});
