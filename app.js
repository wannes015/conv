const ytdl = require("ytdl-core");
const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const ffmpeg = require("fluent-ffmpeg");
const Duplex = require("stream").Duplex;
const Readable = require("stream").Readable;
const NodeID3 = require("node-id3");

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

app.post("/test", async (req, res) => {
    try {
        const url = req.body.url;
        const info = await ytdl.getBasicInfo(url);

        res.writeHead(200, {
            "Content-Type": "audio/mpeg",
            "Content-Disposition":
                'attachment; filename="' +
                (req.body.artist + " - " + req.body.title ||
                    info.videoDetails.title) +
                '.mp3"',
        });

        const tags = {
            title: req.body.title,
            artist: req.body.artist.split(","),
            genre: req.body.genre,
        };

        const stream = ytdl(url);
        let proc = ffmpeg(stream);

        const bufs = [];
        const writ = new Duplex();
        writ._read = () => {};
        writ._write = function (chunk, enc, next) {
            bufs.push(chunk);
            next();
        };

        console.log("test");

        proc.setFfmpegPath("C:/ffmpeg/bin/ffmpeg.exe");
        proc.audioCodec("libmp3lame")
            .format("mp3")
            .on("end", () => {
                console.log("finish");
                const buffer = Buffer.concat(bufs);
                let success = NodeID3.write(tags, buffer);
                const readable = new Readable();
                readable._read = () => {};
                readable.push(success);
                readable.push(null);
                readable.on("end", () => {
                    res.end();
                });
                readable.pipe(res);
            })
            .output(writ)
            .run();
    } catch (error) {
        console.log(error);
    }
});
// Listen
const port = process.env.PORT || 5000;
app.listen(port, () => {});
