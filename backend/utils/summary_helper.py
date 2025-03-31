from groq import Groq
import os
import re

client = Groq(
    api_key=os.getenv("GROQ_API_KEY"),
)

prompting_model="deepseek-r1-distill-llama-70b"
summary_model="deepseek-r1-distill-llama-70b"

def remove_think_tags(text):
    # Remove all content between <think> and </think> tags (including tags themselves)
    return re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()

def generate_summary(column_headers, csv_content):
    try:
        prompting_response = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a data scientist and assistant. You provide only an AI prompt and many analytical questions, nothing else. Don't say 'here is the prompt' or any similar phrase."
                },
                {
                    "role": "user",
                    "content": f"I have extracted data from choropleth maps. I will provide data related to following titles: {column_headers}. I want to analyze state-wise trends and get useful insights. Give me a natural language prompt to input with this data into an LLM to extract maximum textual insights. mention in the prompt not to return code or visualizations. mention give paragraphs and not lot of bullets points. If column titles seem unrelated, ask to split summaries accordingly.",
                }
            ],
            model=prompting_model,
        )

        prompting_response_text = prompting_response.choices[0].message.content
        prompting_response_text = remove_think_tags(prompting_response_text)


        summary_response = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "you are a data scientist."
                },
                {
                    "role": "user",
                    "content": f"{prompting_response_text}. CSV Data is as follows (each state related data is separated by new line or \n): {csv_content}",
                }
            ],
            model=summary_model,
        )

        summary_response_text = summary_response.choices[0].message.content
        summary_response_text = remove_think_tags(summary_response_text)

        return summary_response_text
    except Exception as e:
        print(f"An unexpected error occurred while generating summary: {e}")
        return "Failed generate summary!"