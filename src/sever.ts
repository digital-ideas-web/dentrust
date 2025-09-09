import * as dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";;
import cors from "cors";
import path from 'path';
import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
import bodyParser from "body-parser";

import http from "http";
import { verifyToken, authorization } from "./utils/auth";
import axios from "axios";


import * as PaymentService from "./payment/payment.service"
import * as UserService from "./users/users.service"
import * as TransactionService from "./transactions/transaction.service"
import { getAllDeposit, getAllDeposits, getUnverifiedDeposits, getUsers } from "./admin/admin.service";
import { listUnverifiedWithdrawal } from "./withdraw/withdraw.service";

import { userRouter } from "./users/user.router";
import { paymentRouter, } from "./payment/payment.router";
import { withdrawRouter } from "./withdraw/withdraw.router";

import { cookie } from "express-validator";
import { adminRouter } from "./admin/admin.router";
import { prisma } from "./utils/db.sever";
import { mailRoute } from "./handler/mailRoute";
import { transactions } from "./transactions/transactions.router";

import { planConfigs } from "./utils/payment.constants"



dotenv.config();

if (!process.env.PORT) {
    process.exit(1);
}

const PORT: number = parseInt(process.env.PORT as string, 10);
const app = express();
const httpServer = require('http').createServer(app)


app.use(
    cors({
        origin: (origin, callback) => callback(null, true),
        credentials: true,
        //origin: "http://localhost:4000",
    })
);
app.use(express.json());
app.use(cookieParser());
app.use(cookieSession({ secret: process.env.JWT_SECRET_KEY }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')))
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')))
app.use('/js', express.static(path.join(__dirname, 'node_modules/jquery/dist')))


app.use("/api/user", userRouter);
app.use("/api/deposit", paymentRouter);
app.use("/api/withdrawal", withdrawRouter);

app.use('/api', transactions);
app.use('/api', planConfigs);
app.use("/api/admin", adminRouter)
app.use('/api', mailRoute);
//app.use(userToken);
app.use(express.static('public'));



app.use(function (err: any, req: Request, res: Response, next: NextFunction) {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Access-Control-Allow-Headers', 'Content-type,Authorization');
    //res.setHeader('set-cookies', []);

    next(err);
})

app.get('/style.css', (req, res) => {
    res.header('Content-Type', 'text/css');
    res.sendFile(__dirname + '../public/style.css');
});

app.set('view engine', 'ejs');

app.get('/', (req, res) => res.render('home'));
app.get('/homeloggedin', (req, res) => res.render('homeloggedin'));
app.get('/migration', (req, res) => res.render('migrationpage'));
app.get('/about', (req, res) => res.render('about'));
app.get('/aboutloggedin', verifyToken, (req, res) => res.render('aboutloggedin'));
app.get('/edit', (req, res) => res.render('editprofile'));
app.get('/adminDashboard', verifyToken, async (req, res) => {
    // Call the getAllDeposit function to retrieve deposit data
    // await getAllDeposit(req, res);
    res.render('admin')
});
app.get('/admin', (req, res) => res.render('adminLogin'));
app.get('/newadmin', (req, res) => res.render("adminsignup"));
app.get('/plans', verifyToken, authorization('USER'), async (req, res) => res.render('plans'));

app.get('/test', async (req, res) => {
    res.render('test')
});

app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));
app.get('/password', (req, res) => res.render('password'));
app.get('/updatePassword', (req, res) => res.render('updatePassword'));
app.get('/dashboard', verifyToken, authorization('USER'), async (req, res) => {
    try {
        // Type guard to narrow down the type
        if (typeof req.user !== 'number') {
            return res.status(403).json({ message: 'Invalid user ID' });
        }
        const user = req.user;
        const id: number = parseInt(user, 10);
        const roi = await PaymentService.calROI(id)
        const deposits = await PaymentService.listDeposit(id);
        const balance = await PaymentService.getAvailableBalance(id);
        const users = await UserService.getUser(id);
        const totalBalance = await TransactionService.getUserWalletBalance(id)
        const withdraw = await PaymentService.totalWithdraws(id)
        const activeInvestment = await PaymentService.activeInvestment(id)


        // console.log('deposit:', deposits)
        // console.log('roi:', roi)
        // console.log('balance:', balance)
        // console.log('user:', users)
        // Render the EJS template and pass the data
        res.render('dashboard1', { deposits, roi, balance, users, totalBalance, withdraw, activeInvestment });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
})

app.get('/profile', verifyToken, async (req, res) => {
    try {
        // Type guard to narrow down the type
        if (typeof req.user !== 'number') {
            return res.status(403).json({ message: 'Invalid user ID' });
        }
        const userId = req.user;
        const id: number = parseInt(userId, 10);
        const user = await UserService.getUser(id)

        // Render the EJS template and pass the data
        res.render('profile', { user })
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }

})

app.get('/contact', (req, res) => res.render('withdrawlaContact'));
app.get('/users', verifyToken, async (req, res) => {
    await getUsers(req, res)
});
app.get('/trans', verifyToken, async (req, res) => {
    await getAllDeposits(req, res)
});
app.get('/adminSignUser', (req, res) => res.render('adminSignUser'));
app.get('/verify', (req, res) => res.render('verify'));
app.get('/success', (req, res) => res.render('success'));
app.get('/successwithdraw', (req, res) => res.render('successwithdraw'));
app.get('/withdraw', verifyToken, async (req, res) => {
    try {
        // Type guard to narrow down the type
        if (typeof req.user !== 'number') {
            return res.status(403).json({ message: 'Invalid user ID' });
        }
        const user = req.user;
        const id: number = parseInt(user, 10);
        const roi = await PaymentService.calROI(id)
        const balance = await PaymentService.getAvailableBalance(id);
        const users = await UserService.getUser(id);
        const withdraw = await PaymentService.totalWithdraws(id);

        // Render the EJS template and pass the data
        res.render('withdrawal', { roi, balance, users, withdraw });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/depositPay', verifyToken, (req, res) => res.render('installmentPay'));
app.get('/verifyDeposit', (req, res) => res.render('verifyInstallment'));
app.get('/transaction', verifyToken, (req, res) => res.render('installmentTransaction'));

httpServer.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});