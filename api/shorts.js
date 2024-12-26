const ytdl = require('ytdl-core');
const fs = require('fs');
require("dotenv").config();
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const axios = require('axios');

import Mux from '@mux/mux-node';
const client = new Video({
    tokenId: process.env.MUX_ACCESS_TOKEN,
    tokenSecret: process.env.MUX_SECRET_KEY,
});

const createShort = async (videoUrl, allShorts) => {
    const videoPath = 'video.mp4';
    const trimmedPath = 'short.mp4'; // Output after trimming and adjusting aspect ratio
    const finalPath = 'short_with_transcript.mp4';

    console.log('Downloading video...');
    await downloadVideo(videoUrl, videoPath);

    const short = allShorts[0];  // Assuming you're processing the first short
    console.log(short)
    const startTime = convertToSeconds(short[0].start_time);
    const endTime = convertToSeconds(short[short.length - 1].end_time);

    try {
        console.log('Trimming and adjusting aspect ratio...');
        await trimVideo(videoPath, trimmedPath, startTime, endTime);

        console.log('Adding transcript...');
        await uploadVideoAndGetSubtitles(trimmedPath, finalPath);

        console.log('Short created:', finalPath);
    } catch (error) {
        console.error('Error:', error);
    }
};

const convertToSeconds = (time) => {
    const [minutes, seconds] = time.split(':').map(Number);
    return minutes * 60 + seconds;
};

const downloadVideo = (videoUrl, outputPath) => {
    const options = {
        quality: 'lowest',
        filter: 'videoandaudio',
    };

    return new Promise((resolve, reject) => {
        ytdl(videoUrl, options)
            .pipe(fs.createWriteStream(outputPath))
            .on('finish', resolve)
            .on('error', reject);
    });
};

const trimVideo = (inputPath, outputPath, startTime, endTime) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .setStartTime(startTime)
            .setDuration(endTime - startTime)
            .videoFilter("scale=1080:-1,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black")
            .output(outputPath)
            .on('end', resolve)
            .on('error', reject)
            .run();
    });
};

// Function to upload video to Mux and get subtitles
const uploadVideoAndGetSubtitles = async (videoPath, outputPath) => {
    try {
        console.log('Uploading video to Mux...');
        const asset = await uploadVideoToMux(videoPath);

        // Wait for video processing to complete
        console.log('Waiting for video processing...');
        const processedAsset = await waitForProcessing(asset.id);

        // Fetch captions from the processed video
        console.log('Fetching subtitles...');
        const captionsTrack = await getCaptions(processedAsset.id);

        // Download subtitles if they exist
        if (captionsTrack && captionsTrack.url) {
            await downloadSubtitles(captionsTrack.url, outputPath);
        } else {
            console.log('No captions found for this video.');
        }
    } catch (error) {
        console.error('Error uploading video and getting subtitles:', error);
    }
};

// Upload video to Mux
const uploadVideoToMux = (videoPath) => {
    return new Promise((resolve, reject) => {
        client.video.Assets.create({
            input: [{ url: 'https://storage.googleapis.com/muxdemofiles/mux-video-intro.mp4' }],
        })
            .then(resolve)
            .catch(reject);
    });
};

// Wait for video processing to complete
const waitForProcessing = (assetId) => {
    return new Promise(async (resolve, reject) => {
        while (true) {
            const updatedAsset = await mux.Assets.get(assetId);
            if (updatedAsset.status === 'ready') {
                resolve(updatedAsset);
                break;
            }
            if (updatedAsset.status === 'errored') {
                reject(new Error('Mux video processing failed.'));
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds
        }
    });
};

// Get captions for the video
const getCaptions = async (assetId) => {
    try {
        const asset = await mux.Assets.get(assetId);
        const captionsTrack = asset.tracks.find((track) => track.type === 'text');
        return captionsTrack;
    } catch (error) {
        console.error('Error fetching captions:', error);
    }
};

// Download subtitle file from Mux
const downloadSubtitles = async (subtitleUrl, outputPath) => {
    try {
        const response = await axios.get(subtitleUrl, { responseType: 'stream' });
        const subtitleStream = fs.createWriteStream(outputPath);
        response.data.pipe(subtitleStream);

        return new Promise((resolve, reject) => {
            subtitleStream.on('finish', resolve);
            subtitleStream.on('error', reject);
        });
    } catch (error) {
        console.error('Error downloading subtitles:', error);
    }
};

module.exports = { createShort };
