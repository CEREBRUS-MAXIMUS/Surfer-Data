import { parseISO, isToday, isYesterday, format } from 'date-fns';

const GITHUB_BASE_URL = 'https://github.com/Surfer-Org/Protocol/tree/main';

export const formatLastRunTime = (dateString: string) => {
  const date = parseISO(dateString);
  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`;
  } else if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mm a')}`;
  } else {
    return format(date, "MMM d, yyyy 'at' h:mm a");
  }
};

export const formatExportSize = (sizeInBits: number) => {
  if (!sizeInBits) return 'Unknown size';

    const units = ['KB', 'MB', 'GB', 'TB'];
    let size = sizeInBits / (8 * 1024); // Convert bits to KB
    let unitIndex = 0;

    while (size >= 1000 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    // Format to a maximum of 4 digits
    let formattedSize;
    if (size >= 100) {
      formattedSize = Math.round(size).toString();
    } else if (size >= 10) {
      formattedSize = size.toFixed(1);
    } else {
      formattedSize = size.toFixed(2);
    }

  return `${formattedSize} ${units[unitIndex]}`;
};

export const getCodeExamples = async (run: any) => {
  const fetchGithubFile = async (path: string) => {
    const response = await fetch(
      `https://raw.githubusercontent.com/Surfer-Org/Protocol/main/${path}`
    );
    return response.text();
  };

  const dashboardPath = 'cookbook/python/streamlit-chatbot/app.py';
  const dashboardCode = await fetchGithubFile(dashboardPath);

  const knowledgeGraphPath = 'cookbook/python/knowledge-graph/app.py';
  const knowledgeGraphCode = await fetchGithubFile(knowledgeGraphPath);

  return {
    dashboard: {
      code: dashboardCode,
      githubUrl: `${GITHUB_BASE_URL}/${dashboardPath}`
    },
    knowledge_graph: {
      code: knowledgeGraphCode,
      githubUrl: `${GITHUB_BASE_URL}/${knowledgeGraphPath}`
    },
    ai_training: {
      code: `from surfer import SurferClient
from sklearn.model_selection import train_test_split
import pandas as pd

# Get your data (make sure desktop app is running!)
client = SurferClient()
data = client.get("${run.platformId}")
files = client.load_files(data['exportPath'])

# Prepare your data
df = files[0].to_dataframe()
X_train, X_test, y_train, y_test = train_test_split(
    df.drop('target', axis=1), 
    df['target'], 
    test_size=0.2
)

# Train your model
# Add your model training code here`,
      githubUrl: `${GITHUB_BASE_URL}/cookbook/python/ml-training`
    }
  };    
};