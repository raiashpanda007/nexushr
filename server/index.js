import express from "express"
import http from "node:http"
import { WebSocketServer } from "ws"
import cors from "cors"

const app = express()

app.use(cors({
    origin: "http://localhost:5000"
}))
app.use(express.json())


const server = http.createServer(app);


const wss = new WebSocketServer({ server, path: "/ws" })

app.get("/healthz", (req, res) => {
    res.status(200).send("ok")
})


server.listen(3000, () => {
    console.log("Server started on port 3000")
})


wss.on("connection", (ws) => {
    console.log("Client connected")
})