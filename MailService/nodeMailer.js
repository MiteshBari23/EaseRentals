const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const otpGenerator = require("otp-generator");

dotenv.config();

// Configure the transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Set to true if using port 465
  auth: {
    user: process.env.MAIL_SERVICE_ADDRESS,
    pass: process.env.MAIL_SERVICE_PASS,
  },
});

let generatedOtp = null;

function generateBookingNumber() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit booking number
}

// Function to send OTP via email
async function sendOtpEmail(toEmail, otp) {
  const info = await transporter.sendMail({
    from: '"AutoMail" <AutoMail.02.11.04@gmail.com>',
    to: toEmail,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}`,
    html: `
      <html>
      <head>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #f9f9f9;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            text-align: center;
          }
          .otp-header {
            font-size: 24px;
            color: #007BFF;
            margin-bottom: 20px;
          }
          .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #333;
            background-color: #f0f0f0;
            padding: 15px;
            border-radius: 5px;
            display: inline-block;
            margin: 20px 0;
          }
          .message {
            font-size: 16px;
            margin: 10px 0;
            color: #666;
          }
          .footer {
            font-size: 14px;
            color: #999;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="otp-header">Your OTP Verification Code</div>
          <div class="otp-code">${otp}</div>
          <div class="message">Please enter the code above in the application to proceed. This code is valid for 10 minutes.</div>
          <div class="footer">
            If you did not request this, please ignore this email.<br/>
            <strong>AutoMail</strong> - My Custom Mail Service.
          </div>
        </div>
      </body>
      </html>
    `,
  });

  console.log("Message sent: %s", info.messageId);
}

// Generate OTP and send it via email
// async function generateAndSendOtp(req, res) {
async function generateAndSendOtp(email) {
  // console.log("this is from the nodeMailer file "+email)
  // return;

  // const { email } = req.body;

  if (!email) {
    console.log("email not found and wont send otp");
    return;
    // return res.status(400).json({ error: "Email is required." });
  }

  // // Generate a 6-digit OTP (you can adjust the length if needed)
  const otp = otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  generatedOtp = otp;
  // // Call the function to send OTP via email
  try {
    await sendOtpEmail(email, otp);
    // res.status(200).json({ message: "OTP sent successfully!" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    // res.status(500).json({ error: "Failed to send OTP" });
  }
}

// OTP Verification function
// OTP Verification function
async function verifyOtp(userOtp, res) {
  if (userOtp === generatedOtp) {
    console.log("OTP is valid");
    return res.status(200).json({ message: "OTP verified successfully!" });
  } else {
    console.log("OTP is invalid");
    return res.status(400).json({ message: "Invalid OTP!" });
  }
}
// const toEmail = "varunvisave@gmail.com";
// const username = "varun";
// const mobile = "1234567890";
// const bookingDate = "02-11-2004";
async function sendBookingConfirmationEmail(toEmail, username, mobile, bookingDate) {
// async function sendBookingConfirmationEmail() {
  const bookingNumber = generateBookingNumber();
  const info = await transporter.sendMail({
    from: '"Booking Confirmation" <AutoMail.02.11.04@gmail.com>',
    to: toEmail,
    // to: toEmail,
    subject: "Booking Confirmation",
    html: ` 
      <html>
      <head>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #f2f2f2;
            margin: 0;
            padding: 0;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            text-align: center;
          }
          .header {
            background-color: #4CAF50;
            padding: 15px;
            border-radius: 8px 8px 0 0;
            color: white;
            font-size: 24px;
            font-weight: bold;
          }
          .content {
            padding: 20px;
          }
          .highlight {
            font-size: 20px;
            color: #ffffff;
            font-weight: bold;
          }
          .user-details {
            font-size: 18px;
            color: #333;
            margin: 20px 0;
          }
          .user-details span {
            font-weight: bold;
          }
          .dynamic-section {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
          }
          .footer {
            margin-top: 20px;
            font-size: 14px;
            color: #555;
          }
          .cta-btn {
            display: inline-block;
            padding: 12px 24px;
            background: #22c1c3;  /* fallback for old browsers */
            background: -webkit-linear-gradient(to right, #fdbb2d, #22c1c3);  /* Chrome 10-25, Safari 5.1-6 */
            background: linear-gradient(to right, #fdbb2d, #22c1c3); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */


            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
            font-size: 16px;
          }
          .thanks-message {
            font-size: 18px;
            color: #4CAF50;
            margin-top: 10px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Booking Confirmed! 🎉</div>
          <div class="content">
            <p class="highlight">Hooray, <strong>${username}</strong>! Your booking is officially reserved.</p>
            <p>We are thrilled to have you on board. You’ve successfully booked your room for the selected date. Here are your booking details:</p>

            <div class="dynamic-section">
              <div class="user-details">
                <p><strong>🔢 Booking Number:</strong> ${bookingNumber}</p>
                <p><span>📞 Mobile Number:</span> ${mobile}</p>
                <p><span>📅 Booking Date:</span> ${bookingDate}</p>
              </div>
            </div>

            <p>We’ll make sure everything is set for your visit! You’ll receive an email with the cost estimates and further instructions soon.</p>
            <p>If you have any questions or need to make changes to your booking, feel free to contact us. We’re always here to help!</p>

            <a href="https://easerentals.onrender.com" class="cta-btn">View Your Booking Details</a>

            <div class="thanks-message">Thank you for choosing us!</div>
          </div>

          <div class="footer">
            <p>Stay excited, <strong>${username}</strong>! We look forward to serving you.</p>
            <p>Best Regards,<br><strong>EaseRentals</strong></p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  console.log("Booking confirmation email sent: %s", info.messageId);
}

// sendBookingConfirmationEmail();

module.exports = {
  generateAndSendOtp,
  verifyOtp,
  sendBookingConfirmationEmail,
};
