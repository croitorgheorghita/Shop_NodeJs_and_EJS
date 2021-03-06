const mongoose = require("mongoose");
const express = require("express");
const auth_controller = require("./../controller/auth_controller");

const Product = require("../models/product");
const routes = express.Router();
const User = require("../models/user");
const Traffic = require("../models/traffic");

const nodemailer = require("nodemailer");
const nodemailerSendgrid = require("nodemailer-sendgrid-transport");
const io = require("./../socket");

const transport = nodemailer.createTransport(
  nodemailerSendgrid({
    auth: {
      api_key: `${process.env.SENDGRID_KEY}`
    }
  })
);

routes.get("/", async (req, res) => {
  let products = await Product.find().limit(4);
  let data = new Date().toDateString().split(" ");

  let traficDay = await Traffic.findOne({
    day: data[2],
    month: data[1],
    year: data[3]
  });

  if (traficDay === null) {
    let createTrafficDay = await Traffic.create({
      year: data[3],
      month: data[1],
      day: data[2],
      visits: 1
    });
  } else {
    id = traficDay._id;
    let increaseTraffic = traficDay.visits;
    increaseTraffic = increaseTraffic + 1;

    newTraffic = await Traffic.updateOne(
      { _id: id },
      { $set: { visits: increaseTraffic } }
    );
  }
  io.getIO().emit("products", { action: "visit" });
  res.render("./index.ejs", {
    title: "Luxury watches",
    products: products,
    isLogged: req.session.isLogged
  });
});

routes.get("/index", async (req, res) => {
  let products = await Product.find().limit(4);
  res.render("./index.ejs", {
    title: "Luxury watches",
    products: products,
    isLogged: req.session.isLogged
  });
});

routes.get("/contact", (req, res) => {
  res.render("./contact.ejs", {
    isLogged: req.session.isLogged,
    errorMessage: null
  });
});

routes.get("/resetPassword", (req, res) => {
  res.render("./resetPassword.ejs", {
    isLogged: req.session.isLogged,
    errorMessage:
      "This functionality is not available right now. please try again later"
  });
});

routes.post("/resetPassword", (req, res) => {
  res.render("./resetPassword.ejs", {
    isLogged: req.session.isLogged,
    errorMessage:
      "This functionality is not available right now. please try again later"
  });
});

routes.post("/sendMessage", async (req, res) => {
  let mail = await transport.sendMail({
    to: ["croitorgheorghi@yahoo.com, croitorgheorghita@gmail.com"],
    from: req.body.email,
    subject: "Message from site",
    text: "Sunt" //+ req.body.name + " Telefon: " + req.body.phone + " Si am urmatorul mesaj: "+ req.body.message
  });
  console.log(mail);
  mess = [];
  if (mail.message == "success") {
    mess.push("A mail was send with succes");
  } else {
    mess.push("The mail was not send duo some problem");
  }

  res.render("./contact.ejs", {
    isLogged: req.session.isLogged,
    errorMessage: mess
  });
});

routes.get("/checkout", async (req, res) => {
  err = [];
  if (req.session.isLogged !== true) {
    err.push("You must be authenticated to add to the cart");
    res.render("./checkout.ejs", {
      errorMessage: err[0],
      isLogged: req.session.isLogged
    });
  } else {
    try {
      let userFinal = await User.findById(req.session.user);

      userFinal
        .populate("cart.productId")
        .execPopulate()
        .then(user => {
          products = user.cart;

          if (products.length > 0) {
            for (var i = 0; i < products.length; i++) {
              if (products[i].productId == null) products.splice(i, 1);
            }
            if (products[0].productId === null && products.length == 1) {
              products = [];
            }
          }
          res.render("./checkout.ejs", {
            errorMessage: null,
            isLogged: req.session.isLogged,
            products: products
          });
        });
    } catch (err) {
      console.log(err);
    }
  }
});

routes.get("/typo/?", async (req, res) => {
  let ITEMS_PER_PAGE = 4;
  let page = +req.query.page;

  let nrProducts = await Product.find().count();

  let products = await Product.find()
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE);

  res.render("./typo.ejs", {
    title: "Products",
    products: products,
    isLogged: req.session.isLogged,
    curentPage: page,
    lastPage: Math.ceil(nrProducts / ITEMS_PER_PAGE),
    hasNextPage: ITEMS_PER_PAGE * page < nrProducts,
    hasPreviousPage: page > 1,
    nextPage: page + 1,
    previousPage: page - 1
  });
});

routes.get("/item/:id", async (req, res) => {
  let id = req.params.id;

  let product = await Product.findById(id);

  if (product.visit != undefined) {
    let productVisited = product.visit;
    productVisited = productVisited + 1;

    newProduct = await Product.updateOne(
      { _id: id },
      { $set: { visit: productVisited } }
    );
  }
  let products = await Product.find().limit(3);
  io.getIO().emit("products", { action: "seen" });
  res.render("single.ejs", {
    product: product,
    products: products,
    isLogged: req.session.isLogged
  });
});

module.exports = routes;
