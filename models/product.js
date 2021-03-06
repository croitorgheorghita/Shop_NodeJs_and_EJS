const mongoose =require("mongoose")

const productSchema= new mongoose.Schema({

    title:{
        type: String,
        required: true
    },

    price:{
        type: Number,
        required: true,

    },

    description: {
        type: String,
        required: true
    },

    imageUrl: {
        type: String,
        required: true
    },

    visit:{
        type:Number,
        required: true
    },

    bought:{
        type: Number,
        required: true
    },

    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:true
    }
})

const product= mongoose.model('Product',productSchema)
module.exports=product