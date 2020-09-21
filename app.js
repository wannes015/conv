const ytdl = require("ytdl-core");
const express = require("express");
const app = express();
const path = require("path");
var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("tmp"));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + "/index.html"));
});
app.get("/style.css", function (req, res) {
    res.sendFile(__dirname + "/" + "style.css");
});
app.get("/normalize.css", function (req, res) {
    res.sendFile(__dirname + "/" + "normalize.css");
});
app.post("/", async (req, res, next) => {
    console.log(req.body);
    try {
        const url = req.body.url;

        const info = await ytdl.getBasicInfo(url, { filter: "audioonly" });
        res.writeHead(200, {
            "Content-Type": "audio/mpeg",
            "Content-Disposition":
                'attachment; filename="' + info.videoDetails.title + '.mp3"',
        });

        const pipe = ytdl(url, { filter: "audioonly" }).pipe(res);
        pipe.on("end", () => {
            res.json({ code: 200 });
        });
    } catch (error) {
        res.status(200).send("Invalid youtube URL");
    }
});

// Listen
const port = process.env.PORT || 5000;
app.listen(port, () => {
    // console.log("listening on port: " + port);
});

// const readable = new Readable();
// readable._read = () => {};
// readable.push(buffer);
// readable.push(null);
// readable.on("end", () => {
//     res.end();
// });
// readable.pipe(res);
