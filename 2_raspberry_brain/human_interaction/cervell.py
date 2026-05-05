import google.generativeai as genai

# caldrà carregar les variables d'entorn (api key)

def cargar_personalitat(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()
    

personalitat = cargar_personalitat("prompts/personalitat.txt")

#carreguem model
model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    system_instruction=personalitat
)

def interactuar(input_usuari):
    response = model.generate_content(input_usuari)
    return response.text