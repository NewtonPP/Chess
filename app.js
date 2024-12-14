import express from "express"
import {Server} from "socket.io"
import http from "http"
import { Chess } from "chess.js"
import path from "path"
import { fileURLToPath } from "url"

const app = express();
const server = http.createServer(app)
const io = new Server(server)

const chess = new Chess();

let players = {};
let currentPlayer = 'w'

app.set("view engine", "ejs")

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use(express.static(path.join(__dirname, "public")))


app.get("/", (req,res)=>{
    res.render("index.ejs")
})

io.on("connection", (socket)=>{
    console.log("Connected with a client")   
    
    
if (!players.white){
    players.white = socket.id;
    socket.emit("playerRole", "w")
}
else if (!players.black){
    players.black = socket.id
    socket.emit("playerRole","b")
}
else {
    socket.emit("spectatorRole")
}

socket.on("disconnect", ()=>{
    if(socket.id === players.white){
        delete players.white
    }
    else if (socket.id === players.black){
        delete players.black
    }
})

socket.on("move", (move)=>{
    try {
        if (chess.turn() === "w" && socket.id !== players.white) return;
        if (chess.turn() === "b" && socket.id !== players.black) return;

        const result = chess.move(move)
        if (result){
            currentPlayer = chess.turn();
            io.emit("move", move)
            io.emit("boardState", chess.fen())
        }
        else {
            console.log("Invalid Move", move)
            socket.emit("invalidMove", move)
        }
    } catch (error) {
        console.log(error)
        console.log("Invalid Move", move)
    }
})

})


server.listen(3000, ()=>{
    console.log("Listening on port 3000")
})