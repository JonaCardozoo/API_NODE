const mongoose = require('mongoose');
const userSchema = new mongoose.Schema(
    {
        usuario:{
            type:String
        },
        password:{
            type:String
        }
        
    },
    {
        timestamps:true,
        versionKey:false,
    }
)

const ModelUser = mongoose.model("users",userSchema);
module.exports = ModelUser;