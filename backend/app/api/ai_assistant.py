import os
import json
import urllib.request
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(
    prefix="/ai/assistant",
    tags=["AI Assistant"]
)


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class AssistantChatRequest(BaseModel):
    messages: List[ChatMessage]
    prompt: Optional[str] = None
    language: Optional[str] = "en"


LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi (हिंदी)",
    "kn": "Kannada (ಕನ್ನಡ)",
    "mr": "Marathi (मराठी)"
}


FORMIFY_KNOWLEDGE_BASE = """
You are the official AI Assistant robot for Formify, a modern Smart Form Builder & Response Management Platform.
Your goal is to provide clear, helpful, polite, step-by-step guidance to users asking how to use Formify features.

Key Formify Features & How-To Steps:

1. Creating Forms:
   - Click "+ Create Form" button in top navbar or workspace dashboard.
   - Choose Blank Form, Template, or AI Form Generator (via prompt or microphone voice input).

2. Using Form Builder:
   - Form Title & Description: Click top header fields to edit.
   - Adding Questions: Click "+ Add Question" or select question cards from toolbox.
   - Question Configuration: Customize field labels, placeholder text, help text, min/max limits, custom regex validation.
   - Reordering: Drag questions or use up/down arrows.

3. Question & Field Types:
   - Inputs: Text (short answer), Email, Phone, Number, Textarea (long text), Date picker, File Upload.
   - Choices: Select (Dropdown), Radio Buttons (Single choice), Checkbox (Multiple choices).
   - Rating: Star / numeric rating scale (1-5 or 1-10).
   - Layout: Heading (section title), Description, Section Divider, Page Break (multi-page wizard steps).

4. Required vs. Optional Questions:
   - Toggle "Required" switch on question card. Displays red asterisk (*) and blocks submission until answered.

5. Conditional Logic:
   - Click "Conditional Rules" tab in Form Builder inspector.
   - Set Trigger Question -> Operator (equals, not_equals, contains, not_contains, greater_than, less_than) -> Action (Show/Hide) -> Target Question.

6. Multi-Page Forms:
   - Insert "Page Break" layout element anywhere in your form to split into multiple steps with Next/Previous navigation buttons.

7. Templates:
   - Browse pre-built template gallery (Feedback, Registration, Surveys, Application, HR) or save custom templates to reuse.

8. AI Form Generator & Voice Input:
   - Describe form requirements via text prompt or speak using the Microphone 🎤 voice input button.

9. Theme Customization:
   - Switch between Light and Dark mode using the sun/moon icon. Customize form background header colors, card styling, and fonts.

10. Publishing Forms:
    - Click "Publish Form" top button to generate live public URL. Toggle publish status to activate or disable submissions.

11. Link, QR Code, & Email Sharing:
    - Open "Share" tab on any form. Public Link (copy URL), QR Code (downloadable PNG), or direct email invitations with custom message.

12. Form Scheduling:
    - Under Form Settings (3-dots menu), enable "Schedule Form" and set Start and End date/time windows.

13. Response Limits:
    - Under Form Settings (3-dots menu), enable "Response Limits" and set maximum submission count cap.

14. Responses & Submissions:
    - View submission matrix data table with timestamps and answers. Export all entries as a clean CSV file.

15. Analytics:
    - View total submissions, completion rates, submission trends, and per-question distribution charts.

16. Settings & Security:
    - Form Settings: Password Protection (require password to fill form), Response limits, Scheduling, Email notifications, Delete Form.
"""


def fallback_assistant_reply(user_query: str, language: str = "en") -> str:
    """Fallback knowledge synthesizer supporting EN, HI, KN, MR languages."""
    q = user_query.lower().strip()
    lang = (language or "en").lower()

    # Detect language if not explicitly mapped or fallback to language param
    is_kannada = lang == "kn" or any('\u0C80' <= char <= '\u0CFF' for char in user_query) or "ಕನ್ನಡ" in q
    is_hindi = lang == "hi" or (any('\u0900' <= char <= '\u097F' for char in user_query) and "कसे" not in q)
    is_marathi = lang == "mr" or any(k in q for k in ["मराठी", "कसे", "करावे", "माहिती", "तयार करा"]) or ("कसे" in q and any('\u0900' <= char <= '\u097F' for char in user_query))

    # 1. Multi-Page Forms
    if any(k in q for k in ["multi-page", "multipage", "multiple page", "page break", "steps", "multi page", "मल्टी-पेज", "पेज ब्रेक", "ಮಲ್ಟಿ-ಪೇಜ್", "ಪೇಜ್ ಬ್ರೇಕ್"]):
        if is_kannada:
            return (
                "### 📄 ಮಲ್ಟಿ-ಪೇಜ್ ಫಾರ್ಮ್ (Multi-Page Form) ರಚಿಸುವುದು ಹೇಗೆ\n\n"
                "ನೀವು **Page Break** ಬಳಸಿ ಉದ್ದದ ಫಾರ್ಮ್‌ಗಳನ್ನು ಹಂತಗಳಾಗಿ ವಿಂಗಡಿಸಬಹುದು:\n\n"
                "1. **Form Builder** ನಲ್ಲಿ ನಿಮ್ಮ ಫಾರ್ಮ್ ತೆರೆಯಿರಿ.\n"
                "2. **+ Add Question** ಕ್ಲಿಕ್ ಮಾಡಿ ಮತ್ತು **Page Break** ಆಯ್ಕೆಮಾಡಿ.\n"
                "3. ಪುಟವನ್ನು ವಿಭಜಿಸಲು ಬಯಸುವ ಸ್ಥಳದಲ್ಲಿ Page Break ಇರಿಸಿ.\n"
                "4. Formify ಸ್ವಯಂಚಾಲಿತವಾಗಿ **Next** ಮತ್ತು **Previous** ಬಟನ್‌ಗಳನ್ನು ನೀಡುತ್ತದೆ."
            )
        elif is_marathi:
            return (
                "### 📄 मल्टी-पेज फॉर्म (Multi-Page Form) कसा तयार करायचा\n\n"
                "तुम्ही **Page Break** वापरून मोठे फॉर्म टप्प्यांमध्ये विभाजित करू शकता:\n\n"
                "1. **Form Builder** मध्ये तुमचा फॉर्म उघडा.\n"
                "2. **+ Add Question** वर क्लिक करा आणि **Page Break** निवडा.\n"
                "3. जिथे तुम्हाला पेज विभाजित करायचे आहे तिथे Page Break ठेवा.\n"
                "4. Formify आपोआप **Next** आणि **Previous** बटणे जोडेल."
            )
        elif is_hindi:
            return (
                "### 📄 मल्टी-पेज फॉर्म (Multi-Page Form) कैसे बनाएं\n\n"
                "आप **Page Break** का उपयोग करके लंबे फॉर्म को कई चरणों में विभाजित कर सकते हैं:\n\n"
                "1. **Form Builder** में अपना फॉर्म खोलें।\n"
                "2. **+ Add Question** पर क्लिक करें और **Page Break** चुनें।\n"
                "3. जहां आप पेज को विभाजित करना चाहते हैं वहां Page Break रखें।\n"
                "4. Formify स्वचालित रूप से **Next** और **Previous** बटन जोड़ देगा।"
            )
        else:
            return (
                "### 📄 How to Create a Multi-Page Form\n\n"
                "You can split long forms into multiple steps using **Page Break** elements:\n\n"
                "1. Open your form in the **Form Builder**.\n"
                "2. Click **+ Add Question** or open the field types panel.\n"
                "3. Select **Page Break** under Layout Elements.\n"
                "4. Position the Page Break element between the questions where you want to split pages.\n"
                "5. Formify will automatically add **Next** and **Previous** navigation buttons for respondents."
            )

    # 2. Conditional Logic
    if any(k in q for k in ["conditional", "logic", "branching", "show hide", "show/hide", "if then", "कंडीशनल", "लॉजिक", "ಕಂಡೀಷನಲ್"]):
        if is_kannada:
            return (
                "### 🔀 ಕಂಡೀಷನಲ್ ಲಾಜಿಕ್ (Conditional Logic) ಸೆಟ್ ಮಾಡುವುದು ಹೇಗೆ\n\n"
                "ಉತ್ತರಗಳ ಆಧಾರದ ಮೇಲೆ ಪ್ರಶ್ನೆಗಳನ್ನು ತೋರಿಸಿ ಅಥವಾ ಮರೆಮಾಡಿ:\n\n"
                "1. **Form Builder** ನಲ್ಲಿ **Conditional Rules** ಟ್ಯಾಬ್ ಆಯ್ಕೆಮಾಡಿ.\n"
                "2. **+ Add Rule** ಕ್ಲಿಕ್ ಮಾಡಿ.\n"
                "3. ನಿಯಮವನ್ನು ವಿವರಿಸಿ: ಟ್ರಿಗರ್ ಪ್ರಶ್ನೆ -> ಸ್ಥಿತಿ -> ಆಕ್ಷನ್ (Show / Hide) -> ಗುರಿ ಪ್ರಶ್ನೆ."
            )
        elif is_marathi:
            return (
                "### 🔀 कंडीशनल लॉजिक (Conditional Logic) कसे सेट करायचे\n\n"
                "उत्तरांनुसार प्रश्न दाखवा किंवा लपवा:\n\n"
                "1. **Form Builder** मध्ये **Conditional Rules** टॅब निवडा.\n"
                "2. **+ Add Rule** वर क्लिक करा.\n"
                "3. नियम सेट करा: ट्रिगर प्रश्न -> अट -> कृती (Show / Hide) -> लक्षित प्रश्न."
            )
        elif is_hindi:
            return (
                "### 🔀 कंडीशनल लॉजिक (Conditional Logic) कैसे सेट करें\n\n"
                "उत्तरों के आधार पर प्रश्नों को दिखाएं या छिपाएं:\n\n"
                "1. **Form Builder** में **Conditional Rules** टैब चुनें।\n"
                "2. **+ Add Rule** पर क्लिक करें।\n"
                "3. नियम निर्धारित करें: ट्रिगर प्रश्न -> स्थिति -> एक्शन (Show / Hide) -> लक्ष्य प्रश्न।"
            )
        else:
            return (
                "### 🔀 How to Set Up Conditional Logic\n\n"
                "Show or hide questions based on respondent answers:\n\n"
                "1. In the **Form Builder**, select the **Conditional Rules** tab.\n"
                "2. Click **+ Add Rule**.\n"
                "3. **IF**: Choose trigger question and condition (*equals*, *contains*, *greater than*).\n"
                "4. **THEN**: Set action to **Show** or **Hide** target question.\n"
                "5. Save your form to activate real-time branching logic."
            )

    # 3. Sharing / QR / Link / Email
    if any(k in q for k in ["qr", "share", "email", "invite", "link", "शेयर", "क्यूआर"]):
        if is_kannada:
            return (
                "### 🔗 ಫಾರ್ಮ್ ಹಂಚಿಕೊಳ್ಳುವುದು ಹೇಗೆ (Share Form)\n\n"
                "1. ಫಾರ್ಮ್ ತೆರೆಯಿರಿ ಮತ್ತು **Share** ಟ್ಯಾಬ್ ಕ್ಲಿಕ್ ಮಾಡಿ.\n"
                "2. **Public Link**: ನೇರ ಲಿಂಕ್ ನಕಲಿಸಿ.\n"
                "3. **QR Code**: QR ಕೋಡ್ PNG ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.\n"
                "4. **Email Invitations**: ಇಮೇಲ್ ಆಹ್ವಾನಗಳನ್ನು ಕಳುಹಿಸಿ."
            )
        elif is_marathi:
            return (
                "### 🔗 फॉर्म शेअर कसा करायचा (Share Form)\n\n"
                "1. फॉर्म उघडा आणि **Share** टॅबवर क्लिक करा.\n"
                "2. **Public Link**: थेट लिंक कॉपी करा.\n"
                "3. **QR Code**: QR कोड PNG डाउनलोड करा.\n"
                "4. **Email Invitations**: ईमेल आमंत्रणे पाठवा."
            )
        elif is_hindi:
            return (
                "### 🔗 फॉर्म शेयर कैसे करें (Share Form)\n\n"
                "1. अपना फॉर्म खोलें और **Share** टैब पर क्लिक करें।\n"
                "2. **Public Link**: डायरेक्ट लिंक कॉपी करें।\n"
                "3. **QR Code**: QR कोड PNG डाउनलोड करें।\n"
                "4. **Email Invitations**: डायरेक्ट ईमेल आमंत्रण भेजें।"
            )
        else:
            return (
                "### 🔗 How to Share Your Form\n\n"
                "Formify offers three easy ways to share published forms:\n\n"
                "1. Open your form and click the **Share** tab.\n"
                "2. **Public Link**: Click *Copy Link* to share the form URL.\n"
                "3. **QR Code**: View and click *Download QR Code* PNG.\n"
                "4. **Email Invitations**: Enter recipient emails and click *Send Email Invites*."
            )

    # 4. Default Response
    if is_kannada:
        return (
            "### 💡 Formify AI ಸಹಾಯಕಿಗೆ ಸ್ವಾಗತ!\n\n"
            "ನಾನು ನಿಮಗೆ ಈ ಕೆಳಗಿನ ವಿಷಯಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಹುದು:\n"
            "- **ಫಾರ್ಮ್ ರಚನೆ** ಮತ್ತು **AI Form Generator (Voice Input)** ಬಳಸುವುದು\n"
            "- **ಮಲ್ಟಿ-ಪೇಜ್ ಫಾರ್ಮ್** ಮತ್ತು **ಕಂಡೀಷನಲ್ ಲಾಜಿಕ್** ಹೊಂದಿಸುವುದು\n"
            "- **QR Code**, **Link** ಅಥವಾ **Email** ಮೂಲಕ ಹಂಚಿಕೊಳ್ಳುವುದು\n"
            "- **Responses** ನೋಡುವುದು ಮತ್ತು **CSV Export** ಮಾಡುವುದು\n\n"
            "ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ!"
        )
    elif is_marathi:
        return (
            "### 💡 Formify AI सहाय्यकामध्ये आपले स्वागत आहे!\n\n"
            "मी तुम्हाला खालील विषयांवर मार्गदर्शन करू शकतो:\n"
            "- **फॉर्म तयार करणे** आणि **AI Form Generator (Voice Input)** वापरणे\n"
            "- **मल्टी-पेज फॉर्म** आणि **कंडीशनल लॉजिक** सेट करणे\n"
            "- **QR Code**, **Link** किंवा **Email** द्वारे शेअर करणे\n"
            "- **Responses** पाहणे आणि **CSV Export** करणे\n\n"
            "तुमचा प्रश्न विचारा!"
        )
    elif is_hindi:
        return (
            "### 💡 Formify AI सहायक में आपका स्वागत है!\n\n"
            "मैं आपको इन विषयों पर चरण-दर-चरण मार्गदर्शन दे सकता हूँ:\n"
            "- **फॉर्म बनाना** और **AI फॉर्म जनरेटर (वॉयस इनपुट)** का उपयोग करना\n"
            "- **मल्टी-पेज फॉर्म** और **कंडीशनल लॉजिक** सेट करना\n"
            "- **QR कोड**, **लिंक** या **ईमेल** से शेयर करना\n"
            "- **रिस्पॉन्स** देखना और **CSV रिपोर्ट एक्सपोर्ट** करना\n\n"
            "अपना प्रश्न पूछें!"
        )
    else:
        return (
            "### 💡 How can I help you with Formify?\n\n"
            "I can guide you step-by-step on using Formify features:\n"
            "- **Creating forms** & using the **AI Form Generator** (with Voice input)\n"
            "- Setting up **Question Types**, **Required fields**, and **Multi-page forms**\n"
            "- Configuring **Conditional Logic Rules**\n"
            "- Sharing forms via **Link**, **QR Code**, or **Email**\n"
            "- Setting **Form Scheduling**, **Response Limits**, and **Password Protection**\n"
            "- Viewing **Responses**, **Analytics**, and **Exporting CSVs**\n\n"
            "Feel free to ask a specific question!"
        )


@router.post("/chat")
def chat_with_assistant(request: AssistantChatRequest):
    """
    Formify AI Assistant endpoint supporting English, Hindi, Kannada, Marathi.
    """
    user_query = request.prompt or ""
    if not user_query and request.messages:
        user_query = request.messages[-1].content

    if not user_query.strip():
        raise HTTPException(status_code=400, detail="Query prompt cannot be empty")

    target_lang = (request.language or "en").lower()
    target_lang_name = LANGUAGE_NAMES.get(target_lang, "English")

    gemini_key = os.getenv("GEMINI_API_KEY")

    if not gemini_key:
        reply = fallback_assistant_reply(user_query, target_lang)
        return {"reply": reply, "source": "fallback", "language": target_lang}

    # System instruction for Gemini API
    lang_instruction = f"CRITICAL: The user's active language choice is {target_lang_name}. You MUST compose your complete response in {target_lang_name}. If the user types in Hindi/Kannada/Marathi/English, maintain exact fluency in {target_lang_name}."

    history_contents = []
    history_contents.append({
        "role": "user",
        "parts": [{"text": FORMIFY_KNOWLEDGE_BASE + f"\n\n{lang_instruction}\nPlease confirm you understand your role."}]
    })
    history_contents.append({
        "role": "model",
        "parts": [{"text": f"Understood. I am Formify's AI Robot Assistant. I will respond to all questions and follow-up context clearly in {target_lang_name}."}]
    })

    # Append recent conversation history
    for msg in request.messages[-6:]:
        role = "user" if msg.role == "user" else "model"
        history_contents.append({
            "role": role,
            "parts": [{"text": msg.content}]
        })

    # Append explicit language prompt to latest user query
    history_contents[-1]["parts"][0]["text"] += f"\n\n(Please reply in {target_lang_name})"

    # Try calling Gemini models in sequence
    models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
    for model_name in models:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
            payload = {"contents": history_contents}
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                reply_text = data["candidates"][0]["content"]["parts"][0]["text"]
                return {"reply": reply_text, "source": model_name, "language": target_lang}
        except Exception as e:
            print(f"AI Assistant call notice ({model_name}):", e)
            err_msg = str(e).lower()
            if any(term in err_msg for term in ["timeout", "timed out", "temporary failure", "connection refused", "name or service not known"]):
                break

    # Fallback to intelligent synthesizer if Gemini API fails
    reply = fallback_assistant_reply(user_query, target_lang)
    return {"reply": reply, "source": "fallback", "language": target_lang}
