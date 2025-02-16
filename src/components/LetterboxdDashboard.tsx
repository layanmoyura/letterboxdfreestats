"use client"; 
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Film, Star, Calendar } from 'lucide-react';

const LetterboxdStats = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  interface Stats {
    totalFilms: number;
    averageRating: string | number;
    mostWatchedYear: string;
    ratingDistribution: { rating: string; count: number }[];
    recentFilms: { name: string; date: string; rating: string | null; liked: boolean; year: string }[];
    watchesByMonth: { month: string; count: number }[];
    year: { year: string; count: number }[];
    watchesByDate: { date: string; count: number }[];
  }

  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  const corsProxy = 'https://corsproxy.io/?url=';

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch user's diary page
      const diaryUrl = `${corsProxy}${encodeURIComponent(
        `https://letterboxd.com/${username}/films/diary/`
      )}`;
      
      const response = await fetch(diaryUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Parse watched films
      const films = Array.from(doc.querySelectorAll('.diary-entry-row')).map(row => ({
        name: row.querySelector('.headline-3 a')?.textContent?.trim() || '', // Get the movie name from the .frame-title inside td-film-details
        date: row.querySelector('.diary-day a')?.getAttribute('href')?.match(/(\d{4}\/\d{2}\/\d{2})/)?.[0] || '',
        rating: row.querySelector('.rating')?.className?.match(/rated-(\d+)/)?.[1] || null, // Extract rating from class (e.g., "rated-7")
        liked: row.querySelector('.diary-like')?.classList.contains('liked') || false, // Check if liked class exists
        year: row.querySelector('.td-released span')?.textContent?.trim() || '', // Get the release year from td-released
      }));
      
      // Calculate statistics
      const statsData = {
        totalFilms: films.length,
        averageRating: calculateAverageRating(films),
        mostWatchedYear: getMostFrequent(films.map(f => f.year)) || '',
        ratingDistribution: calculateRatingDistribution(films),
        recentFilms: films.slice(0, 5),
        watchesByMonth: calculateWatchesByMonth(films),
        year: calculateYearWatched(films),
        watchesByDate: fillMissingDates(calculateWatchedByDate(films)),
      };

      setStats(statsData);
    } catch (err) {
      setError('Failed to fetch data. Please check the username and try again.');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageRating = (films: any[]) => {
    const ratedFilms = films.filter(f => f.rating);
    if (!ratedFilms.length) return 0;
    return (
      ratedFilms.reduce((sum, film) => sum + Number(film.rating), 0) / ratedFilms.length / 2
    ).toFixed(2);
  };

  const calculateRatingDistribution = (films: any[]) => {
    // Adjust the size of the distribution array to 10 (for 0.5, 1.0, 1.5, ..., 5.0)
    const distribution = Array(10).fill(0);
  
    films.forEach(film => {
      if (film.rating) {
        const index = Math.round(film.rating) - 1;
        if (index >= 0 && index < 10) {
          distribution[index]++;
        }
      }
    });
  
    return distribution.map((count, i) => ({
      rating: ((i + 1) / 2).toFixed(1), // Convert back to rating values (0.5, 1.0, 1.5, ..., 5.0)
      count
    }));
  };
  

  const calculateWatchesByMonth = (films: any[]) => {
    const months: { [key: string]: number } = {};
    let minDate = new Date();
    let maxDate = new Date(0);

    films.forEach(film => {
        const date = new Date(film.date);
        const monthYear = date.toLocaleString('default', { month: 'short' }) + ` ${date.getFullYear()}`;
        months[monthYear] = (months[monthYear] || 0) + 1;

        // Track min and max dates for range
        if (date < minDate) minDate = date;
        if (date > maxDate) maxDate = date;
    });

    // Ensure at least a full year is covered
    minDate.setMonth(minDate.getMonth() - 1); // Ensure previous December is included
    maxDate.setMonth(maxDate.getMonth() + 1); // Ensure next month for proper display

    const fullRange: { month: string; count: number }[] = [];
    for (let d = new Date(minDate); d <= maxDate; d.setMonth(d.getMonth() + 1)) {
        const label = d.toLocaleString('default', { month: 'short' }) + ` ${d.getFullYear()}`;
        fullRange.push({ month: label, count: months[label] || 0 });
    }

    return fullRange;
  };


  const getMostFrequent = (arr: string[]) => {
    return arr.sort((a,b) =>
      arr.filter(v => v === a).length - arr.filter(v => v === b).length
    ).pop();
  };

  const calculateYearWatched = (films: any[]) => {
    const years: { [key: string]: number } = {};

    films.forEach(film => {
      const year = film.year;
      if (year) {
        years[year] = (years[year] || 0) + 1;
      }
    });

    return Object.keys(years).map(year => ({
      year,
      count: years[year]
    }));
  };
  
  const calculateWatchedByDate = (films: any[]) => {
    const dates: { [key: string]: number } = {};

    films.forEach(film => {
      const date = film.date;
      if (date) {
        dates[date] = (dates[date] || 0) + 1;
      }
    });

    return Object.keys(dates).map(date => ({
      date,
      count: dates[date]
    }));
  };

  function fillMissingDates(watchesByDate: { date: string; count: number; }[]): any[] {
    const filledDates: { date: string; count: number }[] = [];
    const dateMap: { [key: string]: number } = {};

    watchesByDate.forEach(entry => {
      dateMap[entry.date] = entry.count;
    });

    const startDate = new Date(watchesByDate[watchesByDate.length - 1].date);
    const endDate = new Date(watchesByDate[0].date);

    for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      filledDates.push({
        date: dateStr,
        count: dateMap[dateStr] || 0
      });
    }

    return filledDates;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-3xl font-bold">Letterboxd Stats</h1>
        <div className="flex gap-2 w-full max-w-md">
          <Input
            type="text"
            placeholder="Enter Letterboxd username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button onClick={fetchStats} disabled={loading}>
            {loading ? 'Loading...' : 'Get Stats'}
          </Button>
        </div>
        {error && <p className="text-red-500">{error}</p>}
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Film className="w-4 h-4" />
                    Total Films
                  </span>
                  <span>{stats.totalFilms}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Average Rating
                  </span>
                  <span>{stats.averageRating}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Most Watched Year
                  </span>
                  <span>{stats.mostWatchedYear}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
              <BarChart width={300} height={200} data={stats.ratingDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Watches by Month</CardTitle>
            </CardHeader>
            <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.watchesByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
            </CardContent>
          </Card>

            <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Watches by Date</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.watchesByDate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" reversed={true} tick={false} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8884d8" />
              </LineChart>
              </ResponsiveContainer>
            </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Watched Years</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.year}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ffc658" />
              </BarChart>
              </ResponsiveContainer>
            </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Recent Watches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
              {stats.recentFilms.map((film, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="flex items-center gap-2">
                  <Film className="w-4 h-4" />
                  {film.name} ({film.year})
                </span>
                <span>{film.rating ? `${Number(film.rating)/2} ★` : 'Not rated'}</span>
                </div>
              ))}
              </div>
            </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
};

export default LetterboxdStats;