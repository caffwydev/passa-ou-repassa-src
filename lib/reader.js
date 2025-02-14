const fs = require("fs/promises");
const path = require("path");

async function readQuestionaries() {
  const folderPath = __dirname + "/../upload";
  
  const questionaries = {};

  try {
    const files = await fs.readdir(folderPath);
    const qnFiles = files.filter(file => path.extname(file) === ".qn");

    await Promise.all(qnFiles.map(async (file, index) => {
      const filePath = path.join(folderPath, file);
      const content = await fs.readFile(filePath, "utf8");
      
      const lines = content.split("\n").filter(line => line.trim());
      if (lines.length < 2) return;

      const [header, ...questions] = lines;
      const questionaryName = header.startsWith('#') 
        ? header.slice(1).trim() 
        : header.trim();

      const parsedQuestions = questions.map(line => {
        const parts = line.split("%").map(part => part.trim());
        if (parts.length !== 5) return null;

        const questionText = parts[0];
        let answer = null;
        const options = [];
        let correctCount = 0;

        for (const option of parts.slice(1)) {
          if (option.startsWith('*')) {
            correctCount++;
            const cleanOption = option.slice(1).trim();
            answer = cleanOption;
            options.push(cleanOption);
          } else {
            options.push(option);
          }
        }

        return correctCount === 1 ? { 
          question: questionText, 
          options, 
          answer 
        } : null;
      }).filter(Boolean);

      if (parsedQuestions.length > 0) {
        questionaries[questionaryName] = {
          questions: parsedQuestions,
          id: index + 1
        };
      }
    }));

    return questionaries;
  } catch (error) {
    console.error("Erro lendo questionários:", error);
    return {};
  }
}

module.exports = readQuestionaries;