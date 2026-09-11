const fs = require('fs');
const path = require('path');
const https = require('https');

const GITHUB_USERNAME = 'tiendung-dev';
const TEMPLATE_FILE = path.join(__dirname, '..', 'README-template.md');
const TARGET_FILE = path.join(__dirname, '..', 'README.md');

function fetchRepos() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/users/${GITHUB_USERNAME}/repos?sort=pushed&direction=desc&per_page=20`,
      headers: {
        'User-Agent': 'Node.js/ProfileUpdater',
        ...(process.env.GITHUB_TOKEN ? { 'Authorization': `token ${process.env.GITHUB_TOKEN}` } : {})
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            resolve(parsed);
          } else {
            console.error('GitHub API error:', parsed);
            resolve([]);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

const LANGUAGE_BADGES = {
  JavaScript: 'https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black',
  TypeScript: 'https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white',
  Python: 'https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white',
  Java: 'https://img.shields.io/badge/Java-ED8B00?style=flat-square&logo=openjdk&logoColor=white',
  HTML: 'https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white',
  CSS: 'https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white',
};

const PROJECT_CUSTOM_DESCRIPTIONS = {
  'AI-VietWorks': '🤖 AI microservice powering intelligent resume matching & ATS scoring using Gemini & Llama 3',
  'API-VietWorks': '⚡ Core RESTful API service for VietWorks recruitment portal & candidate pipeline',
  'Backend-VietWorks': '🛠️ Scalable backend architecture & database connectors for VietWorks ATS',
  'SpaBookingSystem': '💆 End-to-end Spa & Salon Booking platform with real-time notifications & PayOS integration',
  'Workly_App': '📱 Productivity and workflow management mobile application',
  'Fishinghub': '🎣 Community-driven fishing tracking & discovery portal',
  'PRM393': '📱 Mobile application project built with modern cross-platform practices'
};

async function main() {
  console.log('Fetching repositories from GitHub API...');
  const repos = await fetchRepos();

  // Filter out the profile readme repo itself
  const filteredRepos = repos.filter(r => r.name !== GITHUB_USERNAME && !r.fork).slice(0, 6);

  let markdownTable = `| Repository | Description | Primary Stack | Stars | Last Pushed |\n`;
  markdownTable += `| :--- | :--- | :---: | :---: | :---: |\n`;

  for (const repo of filteredRepos) {
    const name = `**[${repo.name}](${repo.html_url})**`;
    const desc = PROJECT_CUSTOM_DESCRIPTIONS[repo.name] || repo.description || 'Modern software engineering project';
    const langBadge = repo.language && LANGUAGE_BADGES[repo.language]
      ? `<img src="${LANGUAGE_BADGES[repo.language]}" alt="${repo.language}" />`
      : `\`${repo.language || 'Code'}\``;
    const stars = `⭐ ${repo.stargazers_count}`;
    const pushedDate = new Date(repo.pushed_at).toISOString().split('T')[0];

    markdownTable += `| ${name} | ${desc} | ${langBadge} | ${stars} | \`${pushedDate}\` |\n`;
  }

  const now = new Date();
  const formattedDate = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]} UTC`;

  console.log('Reading README-template.md...');
  let template = fs.readFileSync(TEMPLATE_FILE, 'utf8');

  // Replace RECENT_PROJECTS
  const projectRegex = /<!-- RECENT_PROJECTS_START -->[\s\S]*?<!-- RECENT_PROJECTS_END -->/;
  const projectReplacement = `<!-- RECENT_PROJECTS_START -->\n\n${markdownTable}\n<!-- RECENT_PROJECTS_END -->`;
  template = template.replace(projectRegex, projectReplacement);

  // Replace LAST_UPDATED
  const updatedRegex = /<!-- LAST_UPDATED -->[\s\S]*?<!-- \/LAST_UPDATED -->/;
  template = template.replace(updatedRegex, `<!-- LAST_UPDATED -->${formattedDate}<!-- /LAST_UPDATED -->`);

  fs.writeFileSync(TARGET_FILE, template, 'utf8');
  console.log('Successfully updated README.md with fresh project data!');
}

main().catch(err => {
  console.error('Error running updater:', err);
  process.exit(1);
});
