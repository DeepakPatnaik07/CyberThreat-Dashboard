import { NextResponse } from 'next/server';
import { scrapeArticles } from '../../../../utils/threatUtils';

export async function GET() {
  try {
    const articles = await scrapeArticles();
    
    // Test with the specific Kimsuky article
    const testArticle = articles.find(article => 
      article.title.includes('Kimsuky') && 
      article.title.includes('BlueKeep')
    );

    if (!testArticle) {
      return NextResponse.json(
        { error: 'Test article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      article: testArticle,
      totalArticles: articles.length
    });
  } catch (error) {
    console.error('Error testing scraping:', error);
    return NextResponse.json(
      { error: 'Failed to test scraping' },
      { status: 500 }
    );
  }
} 