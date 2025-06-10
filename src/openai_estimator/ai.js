import OpenAI from "openai";
const client = new OpenAI();

const response = await client.responses.create({
    model: "gpt-4.1",
    input: "you are a interior desinged estimatoor who have to calculate the cost of a project based on the details provided."
});

console.log(response.output_text);