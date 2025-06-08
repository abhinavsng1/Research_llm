# ResearchLLM Pro Demo

This is a simple demo of the ResearchLLM Pro backend.

## Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the server:
   ```
   uvicorn src.main:app --reload
   ```

4. Open your browser and go to `http://localhost:8000` to see the welcome message.

5. To test the LLM query endpoint, send a POST request to `http://localhost:8000/llm/query` with a JSON body like:
   ```json
   {
     "prompt": "Hello, world!"
   }
   ``` 