const ytdl = require('ytdl-core');
const path = require('path');
const fs = require('fs');
require("dotenv").config();
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const { exec } = require('child_process');

const createShort = async (videoUrl, allShorts) => {
    const videoPath = 'video.mp4';

    console.log('Downloading video...');
    await downloadVideo(videoUrl, videoPath);

    let reel_count = 1;

    for (const short of allShorts) {
        const shortPath = `trimmed_short_${reel_count}.mp4`;
        const finalPath = `final_short_${reel_count}.mp4`;
        reel_count++;

        const srtContent = generateSrt(short);
        const srtfilePath = `subtitle_${reel_count}.srt`;
        fs.writeFileSync(srtfilePath, srtContent, 'utf8');
        console.log(`SRT file has been generated at ${srtfilePath}`);

        const startTime = convertToSeconds(short[0].start_time);
        const endTime = convertToSeconds(short[short.length - 1].end_time);

        try {
            console.log('Trimming and adjusting aspect ratio...');
            await trimVideo(videoPath, shortPath, startTime, endTime);

            console.log('Adding transcript...');
            embedSubtitles(shortPath, srtfilePath, finalPath);
            console.log('Short created:', finalPath);
        } catch (error) {
            console.error('Error:', error);
        }
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
    const sourceFolder = path.join(__dirname, '..');
    const targetFolder = path.join(__dirname, 'static');
    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
    }

    // Read all files in the source folder
    const files = fs.readdirSync(sourceFolder);
    console

    // Filter files that start with 'final_short_'
    const filteredFiles = files.filter(file => file.startsWith('final_short_'));

    filteredFiles.forEach(file => {
        const sourcePath = path.join(sourceFolder, file);
        const targetPath = path.join(targetFolder, file);

        // Move each filtered file
        fs.rename(sourcePath, targetPath, (err) => {
            if (err) {
                console.error(`Failed to move file ${file}:`, err);
            } else {
                console.log(`Moved ${file} to ${targetFolder}`);
            }
        });
    });
    return "success";
};

function escapeWindowsPathWithBackslashAfterColon(filePath) {
    return filePath.replace(/\\/g, '\\\\').replace(/^([a-zA-Z]):/, '$1\\:');
}

const convertToSeconds = (time) => {
    if (typeof time !== 'string') {
        throw new TypeError(`Expected a string, but got ${typeof time}`);
    }
    const [minutes, seconds] = time.split(':').map(Number);
    return minutes * 60 + seconds;
};

function convertToSrtTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

function generateSrt(subtitles) {
    let srtContent = '';
    const baseStartTime = convertToSeconds(subtitles[0].start_time);

    subtitles.forEach((subtitle, index) => {
        const normalizedStart = Math.max(0, convertToSeconds(subtitle.start_time) - baseStartTime);
        const normalizedEnd = Math.max(normalizedStart, convertToSeconds(subtitle.end_time) - baseStartTime);

        const startTime = convertToSrtTime(normalizedStart);
        const endTime = convertToSrtTime(normalizedEnd);

        srtContent += `${index + 1}\n`;
        srtContent += `${startTime} --> ${endTime}\n`;
        srtContent += `${subtitle.snippet}\n\n`;
    });

    return srtContent;
}

const embedSubtitles = (inputVideo, srtFile, outputVideo) => {
    const ffmpegCommand = `ffmpeg -i "${escapeWindowsPathWithBackslashAfterColon(inputVideo)}" -vf "subtitles=${escapeWindowsPathWithBackslashAfterColon(srtFile)}:force_style='Fontsize=12'" -c:v libx264 -c:a aac "${escapeWindowsPathWithBackslashAfterColon(outputVideo)}"`;

    const result = exec(ffmpegCommand, (error, stdout, stderr) => {
        if (error) {
            console.error('Error embedding subtitles:', error);
            return;
        }
        if (stderr) {
            console.log('FFmpeg stderr:', stderr);
        }
        console.log('Subtitles embedded successfully:', stdout);
    });
    console.log(result)
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

module.exports = { createShort };