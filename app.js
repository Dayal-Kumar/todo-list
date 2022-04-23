//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-dayal:52!jYEy24sCPaYs@cluster0.itibx.mongodb.net/todolistDB");
const itemSchema = {
  name : String
};
const listSchema = {
  name:String,
  path:String,
  items: [itemSchema]
}
const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);

const defaultItems = [
  {
    name : "Welcome to your todo list"
  },
  {
    name : "Click on + button to add a new item"
  },
  {
    name : "<-- Click here to delete this item"
  }
];

app.get("/", function(req, res) {

  const day = date.getDate();

  Item.find((err,results)=>{
    if(results.length === 0){
      Item.insertMany(defaultItems, (err)=>{
        if(err){
          console.log(err);
        } else {
          console.log("Successfully added initial items");
        }
      });
    }
    res.render("list", {listTitle: day, path: "/", newListItems: results});
  });

});

app.get("/:customList", (req,res)=>{
  const customListName = _.capitalize(req.params.customList);
  List.findOne({name: customListName}, (err, foundList)=>{
    if(!err){
      if(!foundList){
        const list = new List ({
          name : customListName,
          path : "/"+customListName,
          items : defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      } else {
        res.render("list", {listTitle:foundList.name, path: foundList.path, newListItems:foundList.items});
      }
    }
  })


})

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const item = new Item ({
    name: itemName
  });
  List.findOne({path: req.body.list}, (err,foundList)=>{
    if(foundList) {
      foundList.items.push(item);
      foundList.save();
    } else {
      item.save();
    }
  });
  console.log(req.body);
  res.redirect(req.body.list);
});

app.post("/delete", function(req, res){
  console.log(req.body);
  const listPath = req.body.listPath;
  if(listPath === "/") Item.findByIdAndDelete(req.body.checkbox, (err)=>{
    if(!err) console.log("Successfully Deleted Item by Id "+req.body.checkbox); });
  else {
      List.findOneAndUpdate({path: listPath}, {$pull : {items : {_id : req.body.checkbox}}}, (err, results)=>{
        if(!err) console.log("Successfully deleted item by Id "+req.body.checkbox);
      })
  }
  res.redirect(listPath);
})


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
