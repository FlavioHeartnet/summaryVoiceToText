
import fs from "node:fs";
import OpenAI, {toFile} from "openai";
interface SummaryOptions {
    maxLength?: number;
    style?: 'concise' | 'detailed' | 'bullets';
    language?: string;
}
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

async function main() {
    const file = await toFile(fs.createReadStream("src/files/audio2.mp3"));
    const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: "whisper-1",

    });
    console.log(transcription.text);
    console.log(await summarizeText(transcription.text));
}
function buildPrompt(text: string, options: SummaryOptions): string {
    let prompt = `Please summarize the following text`;

    if (options.style === 'bullets') {
        prompt += ' in bullet points';
    } else if (options.style === 'detailed') {
        prompt += ' in detail';
    } else {
        prompt += ' concisely';
    }

    if (options.language && options.language !== 'en') {
        prompt += ` in ${options.language}`;
    }

    prompt += `:\n\n${text}`;
    return prompt;
}

async function summarizeText(text: string, options: SummaryOptions = {}): Promise<string> {
    const finalOptions = { ...options };

    try {
        const prompt = buildPrompt(text, finalOptions);
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                {
                    role: "system",
                    content: "You are a precise summarization assistant. Your summaries are clear, accurate, and maintain the key points of the original text, in brazilian portuguese."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.5,
            max_tokens: finalOptions.maxLength,
        });

        return response.choices[0]?.message?.content || 'No summary generated';
    } catch (error) {
        console.error('Summarization error:', error);
        throw new Error('Failed to generate summary');
    }
}

main();