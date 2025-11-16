import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Youtube, BookOpen, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ResourceData {
  segment: string;
  blogs: string[];
  youtube_links: string[];
  error?: string;
}

const STUDENT_SEGMENTS = [
  "Slow Processing",
  "Fast Processor",
  "High Energy / Needs Movement",
  "Visual Learner",
  "Logical Learner",
  "Sensitive / Low Confidence",
  "Easily Distracted",
  "Needs Repetition"
];

export default function TeachingResources() {
  const [selectedSegment, setSelectedSegment] = useState<string>(STUDENT_SEGMENTS[0]);
  const [resources, setResources] = useState<ResourceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = async (segment: string) => {
    setLoading(true);
    setError(null);

    try {
      // Call your backend API endpoint
      const response = await fetch(`/api/teaching-resources/${encodeURIComponent(segment)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }

      const data = await response.json();
      setResources(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources(selectedSegment);
  }, [selectedSegment]);

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const getDomainName = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Teaching Resources</h1>
        <p className="text-muted-foreground">
          Discover external teaching strategies and resources tailored to different student learning segments
        </p>
      </div>

      {/* Segment Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Student Learning Segment</CardTitle>
          <CardDescription>
            Choose a learning profile to find relevant teaching strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {STUDENT_SEGMENTS.map((segment) => (
              <Button
                key={segment}
                variant={selectedSegment === segment ? "default" : "outline"}
                onClick={() => setSelectedSegment(segment)}
                className="justify-start"
              >
                {segment}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Fetching resources...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="border-destructive">
          <CardContent className="py-6">
            <p className="text-destructive">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Resources Display */}
      {resources && !loading && !error && (
        <Tabs defaultValue="blogs" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="blogs">
              <BookOpen className="h-4 w-4 mr-2" />
              Articles & Blogs ({resources.blogs.length})
            </TabsTrigger>
            <TabsTrigger value="videos">
              <Youtube className="h-4 w-4 mr-2" />
              YouTube Videos ({resources.youtube_links.length})
            </TabsTrigger>
          </TabsList>

          {/* Blogs Tab */}
          <TabsContent value="blogs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Educational Articles & Blogs</CardTitle>
                <CardDescription>
                  Curated articles and blog posts for "{selectedSegment}" students
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {resources.blogs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No blog articles found for this segment
                  </p>
                ) : (
                  resources.blogs.map((url, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-primary" />
                              <Badge variant="secondary">{getDomainName(url)}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground break-all">
                              {url}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              Open
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>YouTube Video Resources</CardTitle>
                <CardDescription>
                  Video tutorials and strategies for "{selectedSegment}" students
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {resources.youtube_links.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No YouTube videos found for this segment
                  </p>
                ) : (
                  resources.youtube_links.map((url, index) => {
                    const videoId = extractYouTubeId(url);
                    return (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            {videoId && (
                              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                                <iframe
                                  src={`https://www.youtube.com/embed/${videoId}`}
                                  title={`YouTube video ${index + 1}`}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  className="w-full h-full"
                                />
                              </div>
                            )}
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <Youtube className="h-4 w-4 text-red-600" />
                                <span className="text-sm text-muted-foreground">YouTube</span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                asChild
                              >
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2"
                                >
                                  Watch on YouTube
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
