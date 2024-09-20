const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressErrors = require("./utils/ExpressErrors.js");
const {listingSchema, reviewSchema} = require("./schema.js");
const Reviews = require("./models/review.js");
const session = require("express-session");
const flash = require("connect-flash");


const MONGO_URL = "mongodb://127.0.0.1:27017/easeRentals";

main()
    .then(() => {
        console.log("Connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

//Sessions
const sessionOptions = {
    secret: "easeRentals",
    resave: false,  
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, 
        maxAge: 7 * 24 * 60 * 60 * 1000, // day * hrs * mins * sec * milisecond
        httpOnly: true, // prevents client side js from accessing cookies
    }
};

app.use(session(sessionOptions));
app.use(flash()); //always use it before routes as it needs routes for working

//middleware for cookies
app.use((req, res, next)=>{
    res.locals.success = req.flash("success");
    next();  
});

//router objects
const listings = require("./routes/listing.js"); 
// const review = require("./routes/review.js");

//home route
app.get("/", (req, res) => {
   res.redirect("/listings");
});

//validate review
const validateReview = (req, res, next)=>{
    let {error} = reviewSchema.validate(req.body);
    if(error){
        console.log(error)
        let errMsg = error.detail.map((el)=>el.message).join(',');
        throw new ExpressErrors(404, errMsg);
    }else{
        next();
    }
}

//router
app.use("/listings", listings); // router methode
// app.use("/listings/:id/reviews", review) // router method

//Reviews
// POST review route
app.post("/listings/:id/reviews", wrapAsync(async(req, res)=>{
    let listing = await Listing.findById(req.params.id);
    let newReview = new Reviews(req.body.review);
    listing.reviews.push(newReview);   
    await newReview.save(); 
    await listing.save();   
    req.flash("success", "Review Posted Successfully!");
    res.redirect(`/listings/${listing._id}`);

}));

//Delete review Route
app.delete("/listings/:id/reviews/:reviewId", wrapAsync(async (req, res)=>{
    let { id , reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, {$pull:{reviews: reviewId}});
    await Reviews.findByIdAndDelete(reviewId);
    req.flash("success", "Review Deleted Scuccessfully!");
    res.redirect(`/listings/${id}`);
}));

//middleware
app.all("*",(req, res, next)=>{
    next(new ExpressErrors(404, "Page not found!"));
});

app.use((err, req, res, next)=>{
    let {statusCode = 500, message = "something went wrong"} = err;
    // res.render("error.ejs");
    res.status(statusCode).render("listings/error.ejs",{ err });
});

app.listen(8080, () => {
    console.log("Server is running on port 8080");
});