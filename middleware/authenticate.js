const jwt = require("jsonwebtoken");
const User = require("../model/Schema");

const Authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.jwtoken;

    const verifyToken = jwt.verify(
      token,
      process.env.TOKEN
    );
    
    const rootUser = await User.findOne({
      _id: verifyToken._id,
      "tokens:token": token,
    });

    if (!rootUser) {
      return res.status(401).send("err");
    }
    req.token = token;
    req.rootUser = rootUser;
    req.userID = rootUser._id;
    next();
  } catch (err) {
    res.status(401).send("Unauthorized: No token provided");
 
  }
};

module.exports = Authenticate;
