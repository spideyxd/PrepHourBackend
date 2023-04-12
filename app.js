require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const auth = require("./middleware/authenticate");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const DetailUser = require("./model/Schema");
const corsOptions = {
  origin: true,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 8000;
const BASE_URL=process.env.BASE_URL; 


  const connectionParams = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };
  try { 
    mongoose.connect(
      process.env.MONGODB  ,
        connectionParams
    );
    console.log("Database connected succesfully",process.env.BASE_URL);
  } catch (error) {
    console.log(error);
    console.log("Database connection failed");
  }


  
app.post(`${BASE_URL}/register`, async (req, res) => {
  const {
    firstName,
    password,
    graduationYear,
    lastName,
    email,
    purpose,
    date,
    mode,
    role,
    domain,
  } = req.body;

  if (
    !firstName ||
    !password ||
    !lastName ||
    !graduationYear ||
    !email ||
    !role
  )
    return res.status(422).json({ error: "Please fill the fields properly ." });

  DetailUser.findOne({ email }).then((userExist) => {
    if (userExist) return res.status(422).json({ msg: "error" });
    const user = new DetailUser({
      firstName,
      password,
      lastName,
      email,
      graduationYear,
      purpose,
      date,
      mode,
      role,
      domain,
    });

    console.log(user);
    user.save();
    return res.json({ msg: "success" });
  });
});


app.post(`${BASE_URL}/submitDetails`, async (req, res) => {
  const { email, mode, domain ,purpose} = req.body;

  const mentor = await DetailUser.find({
    role: "Mentor",
    mode: mode,
    domain: domain,
  });

  const userrr = await DetailUser.findOne({ email });
// console.log(mentor);
  mentor.map((val) => {
    // // arr=[a,b,c,d]
    // DetailUser.findOne({
    //   email: val.email,
    //  'mentors.email':email
    // }).then((data) => {
    //   if (!data)
        DetailUser.findOneAndUpdate(
          { email: val.email },
          { $push: { mentors: { name: userrr.firstName, email,purpose } } },
          { new: true }
        ).then((dat) => {});
    // });
  });

  res.json({ msg: "success" });
});

app.post(`${BASE_URL}/deleteReq`, async (req, res) => {
  const { email, name } = req.body;

  DetailUser.find({
    role: "Mentor", 
    'mentors.email':email
  }).then((data) => {
    if (data) {  
      data.map((val) => {
       
        DetailUser.findOneAndUpdate(
          { email: val.email },
          { $pull: { mentors: { name, email } } },
          { new: true }
        ).then((dat) => {});
      });
    }
  });

  res.json({ msg: "success" });
});


app.post(`${BASE_URL}/decline`, async (req, res) => {
  const { email, name } = req.body;
  const ans = await DetailUser.findOneAndUpdate(
    { email: email },
    { $pull: { mentors: { name } } },
    { new: true }
  );

  res.json({ msg: "success" });
});

app.post(`${BASE_URL}/loginB`, async (req, res) => {
  let token;
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: "NaN" });
    }
    const userLogin = await DetailUser.findOne({ email: email });

    if (userLogin) {
      const isMatch = await bcrypt.compare(password, userLogin.password);
      token = await userLogin.generateAuthToken();
      res.cookie("jwtoken",token,{
        expires: new Date(Date.now() + 25892000000),
        httpOnly: true,
      });

      if (!isMatch) {
        res.status(400).json({ msg: "error" });
      } else {
        res.json({ msg: "success" });
      }
    } else {
      res.status(400).json({ msg: "error" });
    }
  } catch (err) {
    console.log(err);
  }
});


app.get(`${BASE_URL}/debug`, async (req, res) => {
  
  res.send("hi");
});

app.get(`${BASE_URL}/getinfo`, auth, (req, res) => {
   res.send(req.rootUser);
});

app.get(`${BASE_URL}/logout`, (req, res) => {
  res.clearCookie("jwtoken");
  res.status(200).send("User logout");
});



app.listen(PORT);
