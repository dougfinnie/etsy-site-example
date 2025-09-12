const fs = require('fs');
const path = require('path');

// Etsy SEO Analysis Based on 2025 Best Practices
class EtsySEOAnalyzer {
  constructor() {
    this.subjectiveWords = [
      'beautiful', 'perfect', 'amazing', 'stunning', 'gorgeous', 'lovely', 
      'awesome', 'fantastic', 'wonderful', 'incredible', 'best', 'great',
      'excellent', 'super', 'cute', 'adorable', 'charming', 'elegant'
    ];
    
    this.salesWords = [
      'on sale', 'free delivery', 'free shipping', 'discount', 'bargain',
      'cheap', 'deal', 'offer', 'promotion', 'limited time'
    ];
    
    this.fillerWords = [
      'very', 'really', 'quite', 'just', 'only', 'simply', 'totally',
      'absolutely', 'completely', 'extremely', 'incredibly'
    ];
    
    this.occasionWords = [
      'christmas', 'halloween', 'birthday', 'wedding', 'valentines',
      'mothers day', 'fathers day', 'easter', 'thanksgiving'
    ];
    
    // Common knitting/craft keywords for this shop
    this.craftKeywords = [
      'knitting', 'knitted', 'pattern', 'yarn', 'wool', 'cotton',
      'cardigan', 'sweater', 'jumper', 'hat', 'mittens', 'scarf',
      'baby', 'kids', 'child', 'adult', 'download', 'pdf', 'digital'
    ];
  }

  analyzeTitle(title) {
    const suggestions = [];
    const words = title.toLowerCase().split(/\s+/);
    const wordCount = words.length;
    
    // Check title length (Etsy recommends under 15 words)
    if (wordCount > 15) {
      suggestions.push({
        type: 'length',
        severity: 'high',
        issue: `Title is ${wordCount} words (${wordCount - 15} over recommended 15 words)`,
        suggestion: 'Reduce to under 15 words. Move extra details to tags or description.'
      });
    } else if (wordCount > 12) {
      suggestions.push({
        type: 'length',
        severity: 'medium',
        issue: `Title is ${wordCount} words (approaching 15 word limit)`,
        suggestion: 'Consider shortening for better readability.'
      });
    }
    
    // Check for subjective descriptors
    const foundSubjective = this.subjectiveWords.filter(word => 
      title.toLowerCase().includes(word)
    );
    if (foundSubjective.length > 0) {
      suggestions.push({
        type: 'subjective',
        severity: 'medium',
        issue: `Contains subjective words: ${foundSubjective.join(', ')}`,
        suggestion: 'Move subjective descriptors to tags or description. Focus on factual details.'
      });
    }
    
    // Check for sales language
    const foundSales = this.salesWords.filter(word => 
      title.toLowerCase().includes(word)
    );
    if (foundSales.length > 0) {
      suggestions.push({
        type: 'sales',
        severity: 'high',
        issue: `Contains sales language: ${foundSales.join(', ')}`,
        suggestion: 'Remove all sales-related terms from titles completely.'
      });
    }
    
    // Check for filler words
    const foundFiller = this.fillerWords.filter(word => 
      words.includes(word)
    );
    if (foundFiller.length > 0) {
      suggestions.push({
        type: 'filler',
        severity: 'low',
        issue: `Contains filler words: ${foundFiller.join(', ')}`,
        suggestion: 'Remove filler words to make title more concise and impactful.'
      });
    }
    
    // Check if main item type is clear
    const hasMainItem = this.craftKeywords.some(keyword => 
      title.toLowerCase().includes(keyword)
    );
    if (!hasMainItem) {
      suggestions.push({
        type: 'clarity',
        severity: 'high',
        issue: 'Main item type is unclear',
        suggestion: 'Start title with what the item is (e.g., "Knitting Pattern", "Baby Cardigan", etc.)'
      });
    }
    
    // Check for repetitive keywords
    const wordFreq = {};
    words.forEach(word => {
      if (word.length > 3) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    const repeatedWords = Object.entries(wordFreq)
      .filter(([word, count]) => count > 2)
      .map(([word]) => word);
      
    if (repeatedWords.length > 0) {
      suggestions.push({
        type: 'repetition',
        severity: 'medium',
        issue: `Repeated words: ${repeatedWords.join(', ')}`,
        suggestion: 'Avoid repeating the same words. Use synonyms or move to tags.'
      });
    }
    
    return suggestions;
  }
  
  analyzeDescription(description) {
    const suggestions = [];
    
    if (!description || description.trim().length === 0) {
      suggestions.push({
        type: 'missing',
        severity: 'high',
        issue: 'Description is empty or missing',
        suggestion: 'Add a detailed description starting with what the item is.'
      });
      return suggestions;
    }
    
    const sentences = description.split(/[.!?]+/).filter(s => s.trim());
    const firstSentence = sentences[0] || '';
    const words = description.toLowerCase().split(/\s+/);
    
    // Check if first sentence clearly describes the item
    const hasMainItemInFirst = this.craftKeywords.some(keyword => 
      firstSentence.toLowerCase().includes(keyword)
    );
    if (!hasMainItemInFirst) {
      suggestions.push({
        type: 'clarity',
        severity: 'high',
        issue: 'First sentence doesn\'t clearly describe the item',
        suggestion: 'Start description by clearly stating what the item is (e.g., "This is a knitting pattern for...")'
      });
    }
    
    // Check description length
    if (words.length < 50) {
      suggestions.push({
        type: 'length',
        severity: 'medium',
        issue: `Description is only ${words.length} words`,
        suggestion: 'Expand description with details about materials, size, customization, and unique features.'
      });
    }
    
    // Check for keyword diversity
    const foundKeywords = this.craftKeywords.filter(keyword => 
      description.toLowerCase().includes(keyword)
    );
    if (foundKeywords.length < 3) {
      suggestions.push({
        type: 'keywords',
        severity: 'medium',
        issue: `Only ${foundKeywords.length} relevant keywords found`,
        suggestion: 'Include more relevant keywords naturally throughout the description.'
      });
    }
    
    // Check for variations mention
    const hasVariations = /size|color|material|custom|personali[sz]ed?/i.test(description);
    if (!hasVariations) {
      suggestions.push({
        type: 'variations',
        severity: 'low',
        issue: 'No mention of variations or customization options',
        suggestion: 'Include information about available sizes, colors, materials, or personalization options.'
      });
    }
    
    return suggestions;
  }
  
  analyzeTags(tags) {
    const suggestions = [];
    
    if (!tags || tags.length === 0) {
      suggestions.push({
        type: 'missing',
        severity: 'high',
        issue: 'No tags found',
        suggestion: 'Add up to 13 relevant tags with keywords buyers might search for.'
      });
      return suggestions;
    }
    
    if (tags.length < 10) {
      suggestions.push({
        type: 'count',
        severity: 'medium',
        issue: `Only ${tags.length} tags used (out of 13 allowed)`,
        suggestion: 'Add more tags to maximize discoverability. Use long-tail keywords.'
      });
    }
    
    // Check for single vs multi-word tags
    const singleWordTags = tags.filter(tag => !tag.includes(' '));
    const multiWordTags = tags.filter(tag => tag.includes(' '));
    
    if (multiWordTags.length < singleWordTags.length / 2) {
      suggestions.push({
        type: 'diversity',
        severity: 'medium',
        issue: 'Not enough multi-word (long-tail) tags',
        suggestion: 'Include more specific phrases like "knitting pattern for beginners" rather than just "knitting".'
      });
    }
    
    return suggestions;
  }
  
  generateOverallScore(titleSugs, descSugs, tagSugs) {
    const totalIssues = titleSugs.length + descSugs.length + tagSugs.length;
    const highSeverity = [...titleSugs, ...descSugs, ...tagSugs]
      .filter(s => s.severity === 'high').length;
    const mediumSeverity = [...titleSugs, ...descSugs, ...tagSugs]
      .filter(s => s.severity === 'medium').length;
    
    let score = 100;
    score -= highSeverity * 20;
    score -= mediumSeverity * 10;
    score -= (totalIssues - highSeverity - mediumSeverity) * 5;
    
    return Math.max(0, score);
  }
}

async function analyzeSEOForAllProducts() {
  console.log('🔍 Starting Etsy SEO analysis for all products...\n');
  
  const analyzer = new EtsySEOAnalyzer();
  const productsDir = 'data/products';
  const outputFile = 'etsy-seo-analysis.md';
  
  if (!fs.existsSync(productsDir)) {
    console.error('❌ Products directory not found. Run download-all-products.js first.');
    return;
  }
  
  const productFiles = fs.readdirSync(productsDir)
    .filter(file => file.endsWith('.json'))
    .sort();
    
  if (productFiles.length === 0) {
    console.error('❌ No product files found in data/products/');
    return;
  }
  
  console.log(`📊 Found ${productFiles.length} products to analyze`);
  
  let markdownContent = `# Etsy SEO Analysis Report
Generated: ${new Date().toLocaleString()}

## Executive Summary
This report analyzes ${productFiles.length} products against Etsy's 2025 SEO best practices.

### Key Findings:
- **Title Guidelines**: Under 15 words, clear item type, no subjective/sales language
- **Description Guidelines**: Clear first sentence, relevant keywords, detailed information
- **Tag Guidelines**: Use all 13 tags, include long-tail keywords

---

## Product Analysis

`;

  let totalScore = 0;
  let productCount = 0;
  let highIssueProducts = [];
  let commonIssues = {};
  
  for (const file of productFiles) {
    try {
      const productPath = path.join(productsDir, file);
      const product = JSON.parse(fs.readFileSync(productPath, 'utf8'));
      
      const titleSuggestions = analyzer.analyzeTitle(product.title || '');
      const descSuggestions = analyzer.analyzeDescription(product.description || '');
      const tagSuggestions = analyzer.analyzeTags(product.tags || []);
      
      const score = analyzer.generateOverallScore(titleSuggestions, descSuggestions, tagSuggestions);
      totalScore += score;
      productCount++;
      
      if (score < 60) {
        highIssueProducts.push({ id: product.id, title: product.title, score });
      }
      
      // Track common issues
      [...titleSuggestions, ...descSuggestions, ...tagSuggestions].forEach(sug => {
        commonIssues[sug.type] = (commonIssues[sug.type] || 0) + 1;
      });
      
      markdownContent += `### ${product.title}
**Product ID**: ${product.id}  
**SEO Score**: ${score}/100  
**Handle**: ${product.handle}

`;

      if (titleSuggestions.length > 0) {
        markdownContent += `#### Title Issues (${titleSuggestions.length})\n`;
        titleSuggestions.forEach(sug => {
          const icon = sug.severity === 'high' ? '🔴' : sug.severity === 'medium' ? '🟡' : '🟢';
          markdownContent += `${icon} **${sug.issue}**  \n💡 ${sug.suggestion}\n\n`;
        });
      }
      
      if (descSuggestions.length > 0) {
        markdownContent += `#### Description Issues (${descSuggestions.length})\n`;
        descSuggestions.forEach(sug => {
          const icon = sug.severity === 'high' ? '🔴' : sug.severity === 'medium' ? '🟡' : '🟢';
          markdownContent += `${icon} **${sug.issue}**  \n💡 ${sug.suggestion}\n\n`;
        });
      }
      
      if (tagSuggestions.length > 0) {
        markdownContent += `#### Tag Issues (${tagSuggestions.length})\n`;
        tagSuggestions.forEach(sug => {
          const icon = sug.severity === 'high' ? '🔴' : sug.severity === 'medium' ? '🟡' : '🟢';
          markdownContent += `${icon} **${sug.issue}**  \n💡 ${sug.suggestion}\n\n`;
        });
      }
      
      if (titleSuggestions.length === 0 && descSuggestions.length === 0 && tagSuggestions.length === 0) {
        markdownContent += `✅ **No major SEO issues found!**\n\n`;
      }
      
      markdownContent += `---\n\n`;
      
      console.log(`✓ Analyzed: ${product.title.substring(0, 50)}... (Score: ${score})`);
      
    } catch (error) {
      console.error(`❌ Error analyzing ${file}:`, error.message);
    }
  }
  
  // Add summary statistics at the top
  const avgScore = Math.round(totalScore / productCount);
  const summaryStats = `
### Statistics:
- **Average SEO Score**: ${avgScore}/100
- **Products Analyzed**: ${productCount}
- **Products Needing Attention** (Score < 60): ${highIssueProducts.length}

### Most Common Issues:
${Object.entries(commonIssues)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5)
  .map(([issue, count]) => `- **${issue}**: ${count} products affected`)
  .join('\n')}

${highIssueProducts.length > 0 ? `
### Priority Products (Score < 60):
${highIssueProducts
  .sort((a, b) => a.score - b.score)
  .slice(0, 10)
  .map(p => `- **${p.title.substring(0, 60)}...** (Score: ${p.score})`)
  .join('\n')}
` : ''}
`;

  // Insert summary after the first section
  markdownContent = markdownContent.replace(
    '---\n\n## Product Analysis\n\n',
    summaryStats + '\n---\n\n## Product Analysis\n\n'
  );
  
  fs.writeFileSync(outputFile, markdownContent, 'utf8');
  
  console.log('\n🎉 SEO Analysis Complete!');
  console.log(`📄 Report saved to: ${outputFile}`);
  console.log(`📊 Average SEO Score: ${avgScore}/100`);
  console.log(`⚠️ Products needing attention: ${highIssueProducts.length}`);
  
  return outputFile;
}

if (require.main === module) {
  analyzeSEOForAllProducts().catch(console.error);
}

module.exports = { EtsySEOAnalyzer, analyzeSEOForAllProducts };