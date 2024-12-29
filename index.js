import express from 'express';
import bodyParser from 'body-parser'
import os from 'os'
import fetch from "node-fetch";
import chalk from 'chalk';
import { fileTypeFromBuffer } from 'file-type';
import FormData from 'form-data';
import axios from 'axios';
import * as cheerio from 'cheerio';
import Genius from "genius-lyrics";

const Client = new Genius.Client("s4NNQt5o5aIkGfPkRsJXIJOb5YtdIw92dZt9vCfMfJH9yJr-CZXm8FXN-1CdxNPY");

const app = express();
const port = process.env.PORT || 7860;

app.set('json spaces', 2)

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.json({
        message: 'Selamat datang di API',
        hostname: "https://" + req.hostname
    });
});

app.get('/convert-url', async (req, res) => {
    try {
        const targetUrl = req.query.targetUrl;
        if (!targetUrl || typeof targetUrl !== 'string' || targetUrl.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Parameter 'targetUrl' harus diisi dengan URL yang valid"
            });
        }
        const targetUrlBuffer = await (await fetch(targetUrl)).buffer();
        const convertUrl = await uploader(targetUrlBuffer);
        if (typeof convertUrl === 'string') {
            return res.json({
                success: true,
                data: {
                    url: convertUrl
                }
            });
        } else {
            return res.status(500).json(convertUrl);
        }
    } catch (e) {
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan internal, silakan coba lagi"
        });
    }
});

app.get('/lyrics', async (req, res) => {
    try {
        const query = req.query.query;
        if (!query) return res.json({
           success: false,
           message: "Membutuhkan parameter \"query\""
        })
        const response = await genius(query) 
        res.json({
           success: true,
           data: {
              lyrics: response
           }
        })
    } catch (e) {
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan internal, silakan coba lagi"
        });
    }
});

app.use((req, res, next) => {
    res.status(404).json({
        status: false,
        message: 'Rute tidak ditemukan'
    });
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        status: false,
        message: e.message
    });
});

app.listen(port, () => {
    console.log('Server berjalan di port ' + port);
});

async function uploader(buffer) {
    if (!buffer || !(buffer instanceof Buffer)) {
        return {
            success: false,
            message: 'Input harus berupa Buffer'
        };
    }
    if (buffer.length === 0) {
        return {
            success: false,
            message: 'File tidak boleh kosong'
        };
    }
    try {
        const res = await axios.post('https://wops1-up.hf.space/upload', {
            file: buffer.toString('base64')
        });
        if (res.data && res.data.url) {
            return res.data.url;
        } else {
            return {
                success: false,
                message: 'Respons server tidak valid'
            };
        }
    } catch (e) {
        return {
            success: false,
            message: e.message
        };
    }
}

async function genius(query) {
    try {
        const searches = await Client.songs.search(query);
        const firstSong = searches[0];
        const lyrics = await firstSong?.lyrics();
        if (!lyrics) {
           return {
              success: false,
              message: "Lyrics not found."
           }
        }
        return {
           success: true,
           data: {
              lyrics
           }
        }
    } catch (e) {
        success: false,
        message: e.message
    }
}
