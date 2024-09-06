const mongoose = require('mongoose');
const userSchema = new mongoose.Schema(
    {
        usuario:{
            type:String,
            required:true,
            unique:true
        },
        password:{
            type:String,
            required:true
        },
        rol:{
            type:String,
            default:'user'
        }
        
    },
    {
        timestamps:true,
        versionKey:false,
    }
)

const ModelUser = mongoose.model("users",userSchema);
module.exports = ModelUser;