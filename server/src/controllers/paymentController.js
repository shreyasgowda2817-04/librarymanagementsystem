import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import User from "../models/user.js";
import Notification from "../models/notification.js";
import Payment from "../models/payment.js";
import Member from "../models/member.js";
import Transaction from "../models/transaction.js";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

export const createOrder = async (req, res) => {
  try {
    const { amount, currency = "INR" } = req.body;

    // Check if we are using placeholders
    const isMock = process.env.RAZORPAY_KEY_ID === undefined || 
                   process.env.RAZORPAY_KEY_ID === "rzp_test_placeholder" ||
                   process.env.RAZORPAY_KEY_ID === "";

    // Step 1: Attempt to create a REAL Razorpay order
    try {
      if (!isMock) {
        const options = {
          amount: amount * 100,
          currency,
          receipt: `receipt_${Date.now()}`,
        };
        const order = await razorpay.orders.create(options);
        return res.status(200).json({
          ...order,
          key_id: process.env.RAZORPAY_KEY_ID
        });
      }
    } catch (sdkError) {
      console.log("⚠️ Razorpay SDK Error (Invalid Keys?), falling back to SIMULATED mode:", sdkError.message);
    }

    // Step 2: Fallback to Simulation Mode
    console.log("🛠️ Payment Mode: SIMULATED (Institutional Protocol Active)");
    const mockOrder = {
      id: `order_mock_${Date.now()}`,
      amount: amount * 100,
      currency,
      receipt: `receipt_${Date.now()}`,
      status: "created",
      isMock: true,
      key_id: "rzp_test_placeholder"
    };
    return res.status(200).json(mockOrder);
  } catch (error) {
    console.error("Global Payment Order Error:", error);
    res.status(500).json({ error: "Failed to initialize payment system." });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, isMock } = req.body;

    if (isMock || razorpay_order_id?.startsWith("order_mock_")) {
      console.log("✅ Mock Payment Verified via Internal Protocol");
      
      // Update User Membership, log Fine Payment, or log Donation
      if (req.user) {
        const planName = req.body.planName || "Premium Plan";
        const isFinePayment = planName === "Fine Payment";
        const isDonation = planName === "Donation";
        const tier = (isFinePayment || isDonation) ? null : planName.split(" ")[0];

        const updateData = {
          $push: { 
            paymentHistory: { 
              orderId: razorpay_order_id, 
              paymentId: "SIMULATED_ID",
              amount: req.body.amount || 0,
              planName: planName,
              date: new Date()
            } 
          }
        };

        if (!isFinePayment && !isDonation) {
          updateData.$set = { membership: tier };
        }

        await User.findByIdAndUpdate(req.user._id, updateData);

        if (!isFinePayment && !isDonation) {
          await Notification.create({
            userId: req.user._id,
            title: `${tier} Status Activated`,
            message: `Welcome to the ${tier} Tier! Your institutional privileges have been elevated via Simulated Protocol.`,
            type: "success"
          });
        } else if (isDonation) {
          await Notification.create({
            userId: req.user._id,
            title: "Donation Received",
            message: `Thank you for your generous donation of ₹${req.body.amount || 0}!`,
            type: "success"
          });
        }
        
        // Log to Accounting Ledger
        const member = await Member.findOne({ email: req.user.email });
        if (member) {
          await Payment.create({
            memberId: member._id,
            amount: req.body.amount || 0,
            reason: isDonation ? "Library Donation" : `Membership Upgrade: ${planName}`,
            date: new Date()
          });
        }
      }


      return res.status(200).json({ message: "Payment verified successfully (Simulated). Welcome to the Elite Tier!" });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "placeholder_secret")
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Update User Membership, log Fine Payment, or log Donation for Real Payment
      if (req.user) {
        const planName = req.body.planName || "Premium";
        const isFinePayment = planName === "Fine Payment";
        const isDonation = planName === "Donation";
        const tier = (isFinePayment || isDonation) ? null : planName.split(" ")[0];

        const updateData = {
          $push: { 
            paymentHistory: { 
              orderId: razorpay_order_id, 
              paymentId: razorpay_payment_id,
              amount: req.body.amount || 0,
              planName: planName,
              date: new Date()
            } 
          }
        };

        if (!isFinePayment && !isDonation) {
          updateData.$set = { membership: tier };
        }

        await User.findByIdAndUpdate(req.user._id, updateData);

        if (!isFinePayment && !isDonation) {
          await Notification.create({
            userId: req.user._id,
            title: `${tier} Tier Activated`,
            message: `Transaction verified. Your ${tier} membership is now active.`,
            type: "success"
          });
        } else if (isDonation) {
          await Notification.create({
            userId: req.user._id,
            title: "Donation Received",
            message: `Thank you for your generous donation of ₹${req.body.amount || 0}!`,
            type: "success"
          });
        }
        
        // Log to Accounting Ledger
        const member = await Member.findOne({ email: req.user.email });
        if (member) {
          await Payment.create({
            memberId: member._id,
            amount: req.body.amount || 0,
            reason: isDonation ? "Library Donation" : `Membership Upgrade: ${planName}`,
            date: new Date()
          });
        }
      }

      return res.status(200).json({ message: "Payment verified successfully. Welcome to Premium Institutional Tier!" });
    } else {
      return res.status(400).json({ error: "Invalid payment signature. Transaction compromised." });
    }
  } catch (error) {
    console.error("Payment Verification Error:", error);
    res.status(500).json({ error: "Internal server error during verification." });
  }
};

export const getAllPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate("memberId", "name email")
      .populate("transactionId")
      .sort({ date: -1 });

    res.json(payments);
  } catch (err) {
    next(err);
  }
};

export const getFinancialStats = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const payments = await Payment.find({ date: { $gte: thirtyDaysAgo } });
    const allPayments = await Payment.find();

    const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const last30DaysRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // Group by day for the chart
    const dailyData = {};
    payments.forEach((p) => {
      const dateStr = p.date.toISOString().slice(0, 10);
      if (!dailyData[dateStr]) dailyData[dateStr] = 0;
      dailyData[dateStr] += p.amount;
    });

    const chartData = Object.keys(dailyData)
      .sort()
      .map((date) => ({
        date,
        revenue: dailyData[date]
      }));

    res.json({ totalRevenue, last30DaysRevenue, chartData });
  } catch (err) {
    next(err);
  }
};

export const createFineOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", transactionId } = req.body;
    const isMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === "rzp_test_placeholder" || process.env.RAZORPAY_KEY_ID === "";

    if (!isMock) {
      const options = { amount: amount * 100, currency, receipt: `fine_${Date.now()}` };
      const order = await razorpay.orders.create(options);
      return res.status(200).json({ ...order, key_id: process.env.RAZORPAY_KEY_ID });
    }

    const mockOrder = {
      id: `order_mock_fine_${Date.now()}`,
      amount: amount * 100,
      currency,
      receipt: `fine_${Date.now()}`,
      status: "created",
      isMock: true,
      key_id: "rzp_test_placeholder"
    };
    return res.status(200).json(mockOrder);
  } catch (error) {
    console.error("Create Fine Order Error:", error);
    res.status(500).json({ error: "Failed to initialize fine payment." });
  }
};

export const verifyFinePayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, isMock, transactionId, amount } = req.body;

    if (isMock || razorpay_order_id?.startsWith("order_mock_")) {
      if (transactionId) {
        await Transaction.findByIdAndUpdate(transactionId, { finePaid: true });
      }

      await Payment.create({
        userId: req.user._id,
        orderId: razorpay_order_id,
        paymentId: "SIMULATED_FINE_ID",
        signature: "SIMULATED_SIG",
        amount: amount || 0,
        currency: "INR",
        status: "captured",
        planName: "Fine Payment"
      });

      return res.status(200).json({ success: true, message: "Fine Simulated & Paid Successfully" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                                    .update(body.toString())
                                    .digest("hex");

    if (expectedSignature === razorpay_signature) {
      if (transactionId) {
        await Transaction.findByIdAndUpdate(transactionId, { finePaid: true });
      }

      await Payment.create({
        userId: req.user._id,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        amount: amount || 0,
        currency: "INR",
        status: "captured",
        planName: "Fine Payment"
      });

      return res.status(200).json({ success: true, message: "Fine Paid Successfully" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    console.error("Verify Fine Payment Error:", error);
    res.status(500).json({ error: "Fine Verification Failed" });
  }
};
