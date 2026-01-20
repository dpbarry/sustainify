# Sustainify 🌱

Sustainify is a browser extension designed to help shoppers make more sustainable purchasing decisions online. By analyzing products in real time and presenting clear sustainability insights, Sustainify encourages users to move beyond fast, convenience-driven consumption toward more thoughtful and responsible choices.

---

## Table of Contents
- [Inspiration](#inspiration)
- [What Sustainify Does](#what-sustainify-does)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Challenges](#challenges)
- [Accomplishments](#accomplishments)
- [What We Learned](#what-we-learned)
- [Roadmap](#roadmap)
- [Built With](#built-with)

---

## Inspiration

As e-commerce continues to grow, purchasing products has become effortless—but often at the expense of sustainability. Shoppers are frequently incentivized to prioritize speed, price, and convenience over long-term environmental and ethical impact. Sustainify was created to close this gap by making sustainability information visible, accessible, and actionable at the point of purchase.

---

## What Sustainify Does

Sustainify seamlessly integrates into the online shopping experience through a browser extension. When a user views a product page, Sustainify:

- Analyzes the product and assigns a **Sustainability Score**
- Explains the score with a concise, human-readable justification
- Suggests **more sustainable alternative products** available online

Beyond individual products, Sustainify provides a personalized dashboard that helps users understand and improve their overall shopping habits.

---

## Key Features

### 🌍 Sustainability Scoring
Each product is scored using multiple criteria inspired by the **ESG (Environmental, Social, Governance)** framework, including:
- Material composition
- Transport and emissions impact
- Ethical sourcing
- Community and consumer approval

Scores are displayed directly in the extension alongside a short explanation.

### 🔄 Sustainable Alternatives
When a product scores poorly, Sustainify searches the web to surface links to more sustainable alternatives, helping users make informed substitutions without additional research.

### 📦 Personal Stash & Dashboard
Users can save purchased products to a personal **Stash**, which:
- Tracks online purchases
- Categorizes products by sustainability dimensions
- Updates the user’s overall **Sustainify Score**
- Links each item back to its original product page

This allows users to identify specific areas where their purchasing habits can improve.

### 🌱 Gamified Experience
Each user is assigned a virtual **Sustainify Plant**:
- The plant’s growth and health reflect the user’s Sustainify Score
- Higher sustainability leads to a healthier, more vibrant plant
- Encourages engagement, sharing, and friendly competition

---

## How It Works

1. **Product Detection**  
   The extension detects when a user is viewing a product page.

2. **Data Extraction & Scoring**  
   Relevant product information is extracted and passed through AI-powered workflows to calculate a sustainability score and justification.

3. **Recommendations**  
   Sustainify searches external sources to recommend alternative products with higher sustainability scores.

4. **User Tracking**  
   If the user saves a product, it is added to their Stash and reflected in their dashboard and gamified plant.

---

## Architecture & Tech Stack

### Frontend
- Framework-less implementation
- Built entirely from scratch using:
  - **JavaScript**
  - **HTML**
  - **CSS**
- Supports light and dark modes
- Designed for simplicity, performance, and extensibility

### Backend / Logic
- Powered by **Gumloop** workflows
- Three core workflows:
  1. Product page detection
  2. Sustainability scoring
  3. Sustainable alternative recommendations

---

## Challenges

- **Efficient AI Usage**  
  With access to LLMs and AI agents, a major challenge was balancing capability with sustainability and performance. We iteratively refined workflows to avoid unnecessary AI calls and relied on deterministic logic where possible.

- **Product Recommendations at Scale**  
  Finding sustainable alternatives required a balance between depth and speed:
  - Full web search was too slow and resource-intensive
  - A curated database was not scalable across product categories  
  As an interim solution, we leveraged **Reddit**, querying sustainability-focused subreddits to surface relevant alternatives efficiently.

---

## Accomplishments

- Designed and implemented a clean, intuitive UI with light/dark modes
- Built a fully framework-less browser extension in-house
- Successfully orchestrated multiple AI workflows into a cohesive system
- Delivered meaningful sustainability scores and actionable alternatives
- Introduced gamification to encourage long-term user engagement

---

## What We Learned

- End-to-end browser extension development
- Web scraping and product page detection
- Managing browser state and persistent user data
- Designing and optimizing complex AI-driven workflows
- Translating abstract sustainability concepts into usable product metrics

---

## Roadmap

The next phase of Sustainify focuses on improving the **validity and reliability of sustainability scoring**. While ESG-based heuristics provided a strong starting point, we recognize that sustainability is difficult to quantify precisely.

Planned next steps include:
- Deeper research into standardized sustainability metrics
- Collaboration with industry experts and researchers
- Improving transparency and explainability of scores
- Expanding recommendation sources beyond Reddit
- Enhancing gamification and social features

---

## Built With

- CSS  
- HTML  
- JavaScript  
- Gumloop  
- GitHub  

---

*Built during a hackathon with a focus on sustainability-first design and responsible use of AI.*
