"use client"; 
import React, { useState } from 'react';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Film, Star, Users, TrendingUp } from 'lucide-react';

interface Movie {
  title: string;
  date: string;
  rating: number;
}

// Mock data - in a real app, this would come from your API
const mockData = {
  recentMovies: [
    { title: "Inception", date: "2025-02-14", rating: 4.5 },
    { title: "The Godfather", date: "2025-02-13", rating: 5 },
    { title: "Pulp Fiction", date: "2025-02-12", rating: 4 }
  ],
  monthlyWatches: [
    { month: "Mar", count: 15 },
    { month: "Apr", count: 12 },
    { month: "May", count: 18 }
  ],
  topActors: [
    { name: "Tom Hanks", count: 12 },
    { name: "Morgan Freeman", count: 10 },
    { name: "Leonardo DiCaprio", count: 8 }
  ],
  ratings: [
    { rating: "5.0", count: 25 },
    { rating: "4.5", count: 42 },
    { rating: "4.0", count: 38 }
  ]
};

const LetterboxdDashboard = () => {
  const [username, setUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.get(`https://letterboxd.com/${username}/films/diary/`);
      const $ = cheerio.load(response.data);
      const recentMovies: Movie[] = [];

      // Loop through each diary entry row
      $('.diary-entry-row').each((element: any) => {
        // Extract movie title
        const title = $(element).find('.headline-3 a').text().trim();

        // Extract movie date
        const date = $(element).find('.td-calendar .date a').first().text().trim();
        
        // Extract rating, assuming it's the first span inside td-rating
        const ratingText = $(element).find('.td-rating .rating').text().trim();

        // Convert rating from stars to a number on a scale of 5
        const rating = convertRatingToNumber(ratingText);

        // Push the extracted data into the movies array
        recentMovies.push({ title, date, rating});
      });

      // Update mockData with the scraped data
      mockData.recentMovies = recentMovies;
    } catch (error) {
      console.error('Error fetching data:', error);
    }

    setIsLoading(false);
  };

   // Convert star rating (e.g., "★★★★½") to a number
   const convertRatingToNumber = (ratingText: string): number => {
    const fullStars = (ratingText.match(/★/g) || []).length; // Count the full stars
    const halfStar = ratingText.includes('½') ? 0.5 : 0;  // Check if there's a half star

    // Return the rating as a number on a scale of 5
    return fullStars + halfStar;
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Letterboxd Stats Dashboard</h1>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter Letterboxd username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-64"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Load Stats"}
          </Button>
        </form>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="recent" className="w-full">
        <TabsList>
          <TabsTrigger value="recent">
            <Clock className="w-4 h-4 mr-2" />
            Recent Activity
          </TabsTrigger>
          <TabsTrigger value="stats">
            <TrendingUp className="w-4 h-4 mr-2" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="people">
            <Users className="w-4 h-4 mr-2" />
            People
          </TabsTrigger>
        </TabsList>

        {/* Recent Activity Tab */}
        <TabsContent value="recent">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent Movies */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Watches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockData.recentMovies.map((movie, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Film className="w-4 h-4 mr-2" />
                        <span>{movie.title}</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-1 text-yellow-500" />
                        <span>{movie.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Watch Count */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Watches</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart width={400} height={200} data={mockData.monthlyWatches}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </CardContent>
            </Card>

            {/* Top Actors */}
            <Card>
              <CardHeader>
                <CardTitle>Most Watched Actors</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart width={400} height={200} data={mockData.topActors}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </CardContent>
            </Card>

            {/* Ratings Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Ratings Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart width={400} height={200} data={mockData.ratings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ffc658" />
                </BarChart>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Watch Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">152 hours</div>
                <div className="text-sm text-gray-500">Total watch time</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.2</div>
                <div className="text-sm text-gray-500">Out of 5 stars</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Movies Watched</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89</div>
                <div className="text-sm text-gray-500">This year</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* People Tab */}
        <TabsContent value="people">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Directors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Christopher Nolan</span>
                    <span>8 movies</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Martin Scorsese</span>
                    <span>6 movies</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quentin Tarantino</span>
                    <span>5 movies</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Watched Decades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>2010s</span>
                    <span>45 movies</span>
                  </div>
                  <div className="flex justify-between">
                    <span>2000s</span>
                    <span>32 movies</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1990s</span>
                    <span>28 movies</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LetterboxdDashboard;