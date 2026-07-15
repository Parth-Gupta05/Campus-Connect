const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: 'AIzaSyAXy8ItWIJ0FKsNFwKs5j6cfKhW5lz787A' });

async function list() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash-001',
      contents: 'hi'
    });
    console.log('Success with gemini-1.5-flash-001');
  } catch (e) {
    console.log(e);
  }
}
list();
