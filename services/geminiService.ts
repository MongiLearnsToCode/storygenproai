
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { MOCK_SYSTEM_PROMPTS } from '../mockPrompts'; // These are for content generation
import { StoryFramework, AIOutputMode, Stage } from "../types"; // Added Stage

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn(
    "API_KEY environment variable not set. Gemini API calls will fail. StoryGenPro's AI features require a valid API_KEY."
  );
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "NO_API_KEY_FOUND" });
const model = 'gemini-2.5-flash-preview-04-17';

// Helper to parse JSON, removing potential markdown fences
const parseJsonFromString = (jsonString: string): any => {
  let cleanedString = jsonString.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = cleanedString.match(fenceRegex);
  if (match && match[2]) {
    cleanedString = match[2].trim();
  }
  try {
    return JSON.parse(cleanedString);
  } catch (e) {
    console.error("Failed to parse JSON response:", cleanedString, e);
    // Return null or throw a more specific error to be handled by the caller
    return null; 
  }
};


export const getAIClarifyingQuestions = async (
  frameworkId: string, // not directly used in prompt, but could be for prompt variant selection
  stageName: string,
  stageDescription: string,
  storyContext: string,
  userInstruction?: string
): Promise<string[]> => {
  if (!API_KEY) {
    return Promise.reject("API_KEY for Gemini is not configured.");
  }

  const userInstructionText = userInstruction ? `Consider this specific instruction from the user: "${userInstruction}"` : "";

  const systemInstructionForQuestions = `You are an AI assistant specialized in creative writing and story structure. Your task is to help a writer flesh out a specific stage of their story by generating insightful questions.

The writer is working on the "${stageName}" stage.
The description of this stage is: "${stageDescription}"
The story context developed so far is:
"${storyContext || 'No prior context provided.'}"
${userInstructionText}

Based on this, generate 3 to 4 open-ended questions that will prompt the user to think critically and creatively about this specific stage. The questions should be tailored to the essence of the stage.
Respond ONLY with a JSON object containing a single key "questions" which is an array of strings. Example: {"questions": ["What is a hidden talent of the hero?", "How does the setting reflect the hero's internal state?"]}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: "Please generate questions based on the system instruction.", 
      config: {
        systemInstruction: systemInstructionForQuestions,
        responseMimeType: "application/json",
        temperature: 0.5, 
      }
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error("AI returned no text for questions.");
    }
    
    const parsedJson = parseJsonFromString(rawText);

    if (parsedJson && Array.isArray(parsedJson.questions)) {
      return parsedJson.questions.filter((q: any) => typeof q === 'string');
    } else {
      console.error("Unexpected JSON structure for questions:", parsedJson);
      throw new Error("AI returned an unexpected format for questions. Expected { questions: string[] }.");
    }

  } catch (error) {
    console.error('Error calling Gemini API for questions:', error);
    if (error instanceof Error) {
        return Promise.reject(`AI question generation failed: ${error.message}`);
    }
    return Promise.reject('An unknown error occurred during AI question generation.');
  }
};


export const getAISuggestion = async (
  frameworkId: string,
  stageId: string,
  stageName: string, 
  stageDescription: string, 
  storyContext: string,
  outputMode: AIOutputMode, 
  questionsAndAnswers?: { question: string; answer: string }[],
  userInstruction?: string
): Promise<string> => {
  if (!API_KEY) {
    return Promise.reject("API_KEY for Gemini is not configured. Please set the API_KEY environment variable.");
  }

  let systemInstruction: string;
  let userPromptContent: string;

  let basePrompt = `I am working on the "${stageName}" stage of my story.\n`;
  basePrompt += `Stage Description: ${stageDescription}\n`;
  basePrompt += `The story context from previous and current user inputs is:\n${storyContext || "No prior context provided."}\n\n`;

  if (questionsAndAnswers && questionsAndAnswers.length > 0) {
    basePrompt += "Based on my answers to these clarifying questions:\n";
    questionsAndAnswers.forEach((qa, index) => {
      basePrompt += `Q${index + 1}: ${qa.question}\nA${index + 1}: ${qa.answer || "(No answer provided)"}\n`;
    });
    basePrompt += "\n";
  }

  if (userInstruction) {
    basePrompt += `Specific instruction for this generation: ${userInstruction}\n\n`;
  }

  const presentTenseInstruction = " Always write in the present tense, as if the events are unfolding in real time—like the story is happening right in front of you. This is a strict requirement.";

  switch (outputMode) {
    case AIOutputMode.OUTLINE:
      systemInstruction = `You are a master story structuralist and creative writer. Your task is to generate a concise, narrative bullet-point outline for the story stage: "${stageName}".
This outline should describe 2-4 key events, character actions, or plot points that *happen* within this stage, as if you are summarizing the core beats of the story itself.
It should be a creative scaffold, not instructional advice.
The stage is described as: "${stageDescription}".
Format the output with clear bullet points (e.g., using '*' or '-').
Respond ONLY with the bullet-point outline itself, without any introductory phrases, explanations, or conversational filler.`;
      userPromptContent = `${basePrompt}Generate the narrative outline now.`;
      break;
    
    case AIOutputMode.PROMPT:
      systemInstruction = `You are an insightful writing coach. Your task is to provide 2-3 thought-provoking guiding questions or prompts to help a writer creatively develop the story stage: "${stageName}".
These prompts should inspire the writer to think about character motivations, plot progression, thematic elements, or descriptive details relevant to this stage.
The stage is described as: "${stageDescription}".
Do not write the story content. Respond ONLY with the list of 2-3 questions/prompts, each on a new line.`;
      userPromptContent = `${basePrompt}Generate the guiding prompts now.`;
      break;

    case AIOutputMode.CREATIVE:
    default:
      const baseCreativeSystemInstruction = MOCK_SYSTEM_PROMPTS[frameworkId]?.[stageId] || "You are a helpful writing assistant. Directly generate a story segment for the specified stage. Format with clear paragraphs. Your output must be only the story segment itself, without any introductory phrases, explanations, or conversational filler.";
      systemInstruction = `${baseCreativeSystemInstruction}${presentTenseInstruction}`;
      userPromptContent = `${basePrompt}Now, please generate a compelling story segment for the "${stageName}" stage, incorporating all the provided information. Ensure the story segment itself is well-paragraphed.`;
      break;
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: userPromptContent,
      config: {
        systemInstruction: systemInstruction,
        temperature: outputMode === AIOutputMode.CREATIVE ? 0.7 : 0.5, 
        topK: 40,
        topP: 0.95,
      }
    });
    
    const text = response.text;
    if (text) {
      return text;
    } else {
      console.error("Received empty or unexpected response from Gemini for content:", response);
      return Promise.reject("Received no text from AI for content. The response might be malformed or empty.");
    }
  } catch (error) {
    console.error('Error calling Gemini API for content:', error);
    if (error instanceof Error) {
        return Promise.reject(`AI content generation failed: ${error.message}`);
    }
    return Promise.reject('An unknown error occurred during AI content generation.');
  }
};

export const mapIdeaToFramework = async (
  rawStoryIdea: string,
  framework: StoryFramework
): Promise<Record<string, string>> => {
  if (!API_KEY) {
    return Promise.reject("API_KEY for Gemini is not configured.");
  }
  if (!rawStoryIdea.trim()) {
    // If the idea is empty, return empty content for all stages
    const emptyContent: Record<string, string> = {};
    framework.stages.forEach(stage => {
      emptyContent[stage.id] = '';
    });
    return Promise.resolve(emptyContent);
  }

  const stageDetails = framework.stages
    .map(s => `- Stage ID "${s.id}": "${s.name}" (Description: ${s.description})`)
    .join('\n');

  const systemInstructionForMapping = `You are an expert story analyst and structuralist.
The user has provided a raw story idea and a target story framework. Your task is to intelligently map the user's story idea to the different stages of the provided framework.

The user's raw story idea is:
--- IDEA START ---
${rawStoryIdea}
--- IDEA END ---

The target story framework is "${framework.name}", described as: "${framework.description}".
The stages of this framework (with their IDs) are:
${stageDetails}

Analyze the raw story idea and distribute its content across these stages.
For each stage ID, provide the relevant segment of the story idea that fits that stage.
If a part of the idea seems to span multiple stages, try to break it down logically.
If a stage has no direct corresponding content in the idea, you can leave its content as an empty string or provide a very brief placeholder like "[Content for ${framework.name} - ${framework.stages.find(s => s.id === "stageId")?.name || 'this stage'} based on the overall idea could be developed here.]". Focus on extracting existing content.

Respond ONLY with a JSON object. The keys of this object MUST be the stage IDs (e.g., "${framework.stages[0].id}", "${framework.stages[1].id}", etc.). The values should be the story content assigned to each stage as a string.
Example JSON format if framework has stages with IDs "ordinaryWorld" and "callToAdventure":
{
  "ordinaryWorld": "Content for the ordinary world...",
  "callToAdventure": "Content for the call to adventure..."
}
Ensure the output is a single, valid JSON object and nothing else.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: "Please map the idea to the framework based on the system instruction.", 
      config: {
        systemInstruction: systemInstructionForMapping,
        responseMimeType: "application/json",
        temperature: 0.3, 
      }
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error("AI returned no text for mapping.");
    }

    const parsedJson = parseJsonFromString(rawText);

    if (parsedJson && typeof parsedJson === 'object' && !Array.isArray(parsedJson)) {
      const mappedContent: Record<string, string> = {};
      framework.stages.forEach(stage => {
        if (parsedJson.hasOwnProperty(stage.id) && typeof parsedJson[stage.id] === 'string') {
          mappedContent[stage.id] = parsedJson[stage.id];
        } else {
          console.warn(`AI mapping for stage ID "${stage.id}" was missing or invalid. Defaulting to empty.`);
          mappedContent[stage.id] = ''; 
        }
      });
      for (const key in parsedJson) {
        if (!framework.stages.some(s => s.id === key)) {
          console.warn(`AI returned an unexpected key in mapping: "${key}"`);
        }
      }
      return mappedContent;
    } else {
      console.error("Unexpected JSON structure for mapping:", parsedJson, "Raw AI text:", rawText);
      throw new Error("AI returned an unexpected format for mapping. Expected a JSON object with stage IDs as keys.");
    }
  } catch (error) {
    console.error('Error calling Gemini API for mapping story idea:', error);
    if (error instanceof Error) {
      return Promise.reject(`AI idea mapping failed: ${error.message}`);
    }
    return Promise.reject('An unknown error occurred during AI idea mapping.');
  }
};

export const getAIAllStagesSuggestion = async (
  framework: StoryFramework,
  rawStoryIdea: string,
  outputMode: AIOutputMode, 
  userInstruction?: string
): Promise<Record<string, string>> => {
  if (!API_KEY) {
    return Promise.reject("API_KEY for Gemini is not configured.");
  }
  if (!rawStoryIdea.trim()) {
    const emptyContent: Record<string, string> = {};
    framework.stages.forEach(stage => {
      emptyContent[stage.id] = '';
    });
    return Promise.resolve(emptyContent);
  }

  const stageDetails = framework.stages
    .map(s => `- Stage ID "${s.id}": "${s.name}" (Description: ${s.description})`)
    .join('\n');

  let systemInstructionForFullStory: string;
  let modeSpecificTask: string;
  const presentTenseInstructionForFullStory = "All story content MUST be written in the present tense, as if the events are unfolding in real time—like the story is happening right in front of you. This is a strict requirement for each stage's content.";


  switch (outputMode) {
    case AIOutputMode.OUTLINE:
      modeSpecificTask = "generate a concise, narrative bullet-point outline for EACH stage, describing 2-4 key events, character actions, or plot points that *happen* within each stage, as if you are summarizing the core beats of the story itself. The outlines should be creative scaffolds, not instructional advice.";
      break;
    case AIOutputMode.PROMPT:
      modeSpecificTask = "generate 2-3 insightful guiding questions or thought-provoking prompts for EACH stage to help the user think about how to approach writing that stage.";
      break;
    case AIOutputMode.CREATIVE:
    default:
      modeSpecificTask = `generate compelling story content for EACH stage, formatted with clear paragraphs. ${presentTenseInstructionForFullStory}`;
      break;
  }
  
  systemInstructionForFullStory = `You are an AI story generation assistant. The user will provide a raw story idea, a target story framework (with its name, description, and a list of stages - each stage having an ID, name, and description), and optionally, some overall instructions.
Your task is to ${modeSpecificTask} of the framework, based on the raw story idea and the user's instructions. The generated content for each stage should be detailed and well-written according to the requested mode.
For 'outline' mode, each stage's outline should be bullet points. For 'prompt' mode, each stage should get a list of questions/prompts. For 'creative' mode, each stage should be a narrative segment.
The output MUST be a valid JSON object where keys are the stage IDs from the provided framework, and values are the generated strings (story segment, outline, or prompts) for those respective stages.
Example output for a framework with stages 'intro' and 'climax' in '${outputMode}' mode:
{
  "intro": "Generated content for the intro stage in ${outputMode} mode...",
  "climax": "Generated content for the climax stage in ${outputMode} mode..."
}
Do not include any other text, explanations, or markdown formatting around the JSON object. Ensure each stage receives substantial, relevant content based on the overall idea and requested mode.`;


  const userPromptForFullStory = `Raw Story Idea:
--- IDEA START ---
${rawStoryIdea}
--- IDEA END ---

Framework: ${framework.name} (${framework.description})
Stages:
${stageDetails}

Output Mode Requested: ${outputMode}
User Instructions for entire story (if any): ${userInstruction || 'None. Focus on creativity and adherence to the framework structure and selected output mode based on the idea.'}

Please generate the full story draft according to these details and the system instruction.`;
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: userPromptForFullStory,
      config: {
        systemInstruction: systemInstructionForFullStory,
        responseMimeType: "application/json",
        temperature: outputMode === AIOutputMode.CREATIVE ? 0.75 : 0.6, 
        topK: 40,
        topP: 0.95,
      }
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error("AI returned no text for full story generation.");
    }

    const parsedJson = parseJsonFromString(rawText);

    if (parsedJson && typeof parsedJson === 'object' && !Array.isArray(parsedJson)) {
      const allStagesContent: Record<string, string> = {};
      let allKeysValid = true;
      framework.stages.forEach(stage => {
        if (parsedJson.hasOwnProperty(stage.id) && typeof parsedJson[stage.id] === 'string') {
          allStagesContent[stage.id] = parsedJson[stage.id];
        } else {
          console.warn(`AI full story generation (${outputMode} mode) for stage ID "${stage.id}" was missing or invalid. Defaulting to placeholder.`);
          allStagesContent[stage.id] = `[AI content for ${stage.name} (${outputMode} mode) was not generated or was in an invalid format.]`; 
          allKeysValid = false;
        }
      });
      
      if (!allKeysValid) {
        console.warn("AI did not generate content for all stages as expected.");
      }
      for (const key in parsedJson) {
        if (!framework.stages.some(s => s.id === key)) {
          console.warn(`AI returned an unexpected key in full story generation: "${key}"`);
        }
      }
      return allStagesContent;
    } else {
      console.error("Unexpected JSON structure for full story generation:", parsedJson, "Raw AI text:", rawText);
      throw new Error(`AI returned an unexpected format for full story (${outputMode} mode). Expected a JSON object with stage IDs as keys.`);
    }
  } catch (error) {
    console.error(`Error calling Gemini API for full story generation (${outputMode} mode):`, error);
    if (error instanceof Error) {
      return Promise.reject(`AI full story generation (${outputMode} mode) failed: ${error.message}`);
    }
    return Promise.reject(`An unknown error occurred during AI full story generation (${outputMode} mode).`);
  }
};

export const getAICompleteRemainingStages = async (
  framework: StoryFramework,
  existingContent: Record<string, string>,
  outputMode: AIOutputMode,
  userInstruction?: string
): Promise<Record<string, string>> => {
  if (!API_KEY) {
    return Promise.reject("API_KEY for Gemini is not configured.");
  }

  const emptyStages = framework.stages.filter(s => !existingContent[s.id]?.trim());
  if (emptyStages.length === 0) {
    console.log("No empty stages to complete. Returning empty object.");
    return Promise.resolve({}); // No stages to generate
  }

  const filledStagesDetails = framework.stages
    .filter(s => !!existingContent[s.id]?.trim())
    .map(s => {
      return `Stage: ${s.name} (ID: ${s.id})\nDescription: ${s.description}\nContent:\n${existingContent[s.id]}\n---`;
    })
    .join('\n\n');

  const emptyStagesDetails = emptyStages
    .map(s => `- Stage ID "${s.id}": "${s.name}" (Description: ${s.description})`)
    .join('\n');

  let modeSpecificTask: string;
  const presentTenseInstruction = "All story content MUST be written in the present tense, as if the events are unfolding in real time. This is a strict requirement for each stage's content.";

  switch (outputMode) {
    case AIOutputMode.OUTLINE:
      modeSpecificTask = "generate a concise, narrative bullet-point outline for EACH of the listed REMAINING STAGES. Each outline should describe 2-4 key events or plot points within that stage.";
      break;
    case AIOutputMode.PROMPT:
      modeSpecificTask = "generate 2-3 insightful guiding questions or thought-provoking prompts for EACH of the listed REMAINING STAGES to help the user write that stage.";
      break;
    case AIOutputMode.CREATIVE:
    default:
      modeSpecificTask = `generate compelling story content for EACH of the listed REMAINING STAGES, formatted with clear paragraphs. ${presentTenseInstruction}`;
      break;
  }

  const systemInstructionForCompletion = `You are an AI story generation assistant. The user is partially through writing a story using the "${framework.name}" framework and needs help completing the remaining stages.
Framework Description: "${framework.description}"

Existing Story Content (if any):
${filledStagesDetails || "No prior content provided for filled stages."}

Remaining Stages to Generate Content For:
${emptyStagesDetails}

Output Mode Requested: ${outputMode}
User Instructions for completing story (if any): ${userInstruction || 'None. Focus on creativity, logical continuation from existing content, adherence to the framework structure, and the selected output mode.'}

Your task is to ${modeSpecificTask}.
The output MUST be a valid JSON object where keys are the stage IDs of ONLY THE NEWLY GENERATED STAGES (i.e., the 'Remaining Stages' listed above), and values are the generated strings for those respective stages.
Do not include stages for which content was already provided by the user in your JSON response.
Ensure each generated stage receives substantial, relevant content.
Example (if 'stageC' and 'stageD' were empty and requested):
{
  "stageC": "Generated content for stageC in ${outputMode} mode...",
  "stageD": "Generated content for stageD in ${outputMode} mode..."
}`;

  const userPromptForCompletion = `Based on the existing story content and the framework details, please generate content for the remaining empty stages as per the system instruction.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: userPromptForCompletion,
      config: {
        systemInstruction: systemInstructionForCompletion,
        responseMimeType: "application/json",
        temperature: outputMode === AIOutputMode.CREATIVE ? 0.75 : 0.6,
        topK: 40,
        topP: 0.95,
      }
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error("AI returned no text for completing stages.");
    }

    const parsedJson = parseJsonFromString(rawText);

    if (parsedJson && typeof parsedJson === 'object' && !Array.isArray(parsedJson)) {
      const completedStagesContent: Record<string, string> = {};
      let allExpectedKeysFound = true;

      emptyStages.forEach(stage => {
        if (parsedJson.hasOwnProperty(stage.id) && typeof parsedJson[stage.id] === 'string') {
          completedStagesContent[stage.id] = parsedJson[stage.id];
        } else {
          console.warn(`AI completion for stage ID "${stage.id}" was missing or invalid. Defaulting to placeholder.`);
          completedStagesContent[stage.id] = `[AI content for ${stage.name} (${outputMode} mode) was not generated or was in an invalid format.]`;
          allExpectedKeysFound = false;
        }
      });
      
      if (!allExpectedKeysFound) {
        console.warn("AI did not generate content for all requested empty stages as expected.");
      }
      // Check for unexpected keys
      for (const key in parsedJson) {
        if (!emptyStages.some(s => s.id === key)) {
          console.warn(`AI returned an unexpected key in stage completion response: "${key}". This key will be ignored.`);
        }
      }
      return completedStagesContent; // Return only the newly generated content
    } else {
      console.error("Unexpected JSON structure for stage completion:", parsedJson, "Raw AI text:", rawText);
      throw new Error(`AI returned an unexpected format for completing stages (${outputMode} mode). Expected a JSON object with newly generated stage IDs as keys.`);
    }
  } catch (error) {
    console.error(`Error calling Gemini API for completing stages (${outputMode} mode):`, error);
    if (error instanceof Error) {
      return Promise.reject(`AI stage completion (${outputMode} mode) failed: ${error.message}`);
    }
    return Promise.reject(`An unknown error occurred during AI stage completion (${outputMode} mode).`);
  }
};

