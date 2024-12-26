const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyDu2D0g29ePyAOZ6fJYVeaYf8EUDstxJJE");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const INPUT_LIMIT = 35000;


async function extractShort(transcript) {
    const transcriptChunks = convertTranscriptToChunk(transcript);
    // console.log("TRANSCRIT CHUNKS", transcriptChunks)
    let shorts = [];

    try {
        console.log("Analyzing Transcript...");

        for (let chunk of transcriptChunks) {
            chunkString = JSON.stringify(chunk)
            const shortsFromChunk = await analyzeTranscriptChunk(chunkString);
            shorts = shorts.concat(shortsFromChunk);
        }

        // console.log(JSON.stringify(shorts));

        return shorts;
    } catch (error) {
        console.error("Error in extractShort:", error.message);
    }
}

async function analyzeTranscriptChunk(chunkString) {
    const prompt = `Your task is to analyze the video transcript and identify segments suitable for creating interesting short video clips (e.g., Instagram reels). Each segment should be a collection of individual objects from "chunkString," grouped together for a single reel without combining snippets. Your goal is to retain the snippet structure as it is and group relevant snippets based on their sequential order and logical relevance. Extract up to 3 high-quality segments. Here's the transcript: ${chunkString}.
    
    ### Key Rules:
    1. **Cut Snippets if Necessary**:
    - If a reel's duration needs to end in the middle of a snippet, carefully split the snippet at the necessary point.
    - Retain the part of the snippet used in the current reel and include its exact start_time and end_time in the output.
    - The remaining part of the split snippet will begin the next reel and should have an updated start_time.

    2. **Group Snippets into Reels**:
    - Each reel should have a total duration between 30 to 60 seconds.
    - Group relevant snippets sequentially without skipping any.

    3. **Maintain Original Structure**:
    - Preserve the original structure of each snippet unless splitting is required.
    - Each snippet in the output must include its start_time, end_time, and the exact text portion.

    4. **Output Format**:
    - Represent the result as a valid JSON, where each array represents a reel and each object is a snippet.
    - Use the following structure:
    {
        "reels": [
                    [
                    { "snippet": "String", "start_time": "String", "end_time": "String" },
                    ...
                    ],
                    [
                    { "snippet": "String", "start_time": "String", "end_time": "String" },
                    ...
                    ]
                ]
    }`;

    try {
        const result = await model.generateContent(prompt);
    
        if (result.response.text()) {
            // Extracting the JSON string from the response
            let content = result.response.text();
            let jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      
            if (jsonMatch && jsonMatch[1]) {
              // Parsing the extracted JSON string
              let parsedJson = JSON.parse(jsonMatch[1]);
            //   console.log("Parsed Content is", content);
              return parsedJson;
            } else {
              console.warn("No JSON data found in response");
              console.log(content);
              return JSON.parse(content);
            }
          } else {
            console.warn("Unexpected API response:", content);
            return null;
          }
    } catch (error) {
        console.error("Error during API call:", error.message);
        return { error: error.message };
    }    
}


const convertTranscriptToChunk = (captions) => {
    let chunks = [];
    let currentChunk = [];
    let charCount = 0;

    for (let caption of captions) {
        // Check if snippet is null and handle it appropriately
        let snippetCharCount = caption.snippet ? caption.snippet.length : 0;

        if (charCount + snippetCharCount > INPUT_LIMIT) {
            chunks.push(currentChunk);
            currentChunk = [caption];
            charCount = snippetCharCount;
        } else {
            currentChunk.push(caption);
            charCount += snippetCharCount;
        }
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }

    return chunks;
};

module.exports = { extractShort };