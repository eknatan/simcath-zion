'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LaliGamesPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    ageRange: '',
    platform: '',
    instructions: '',
    language: '',
    duration: '',
    difficulty: '',
    tags: '',
    images: '',
    author: '',
    publishDate: '',
    status: '',
    price: '',
    rating: ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data:', formData);
    // UI only - no backend
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="border-2 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">משחקי ללי</CardTitle>
            <CardDescription className="text-center">הוסף משחק חדש למערכת</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">כותרת</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="הכנס כותרת למשחק"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">קטגוריה</Label>
                  <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר קטגוריה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="חידות">חידות</SelectItem>
                      <SelectItem value="אקשן">אקשן</SelectItem>
                      <SelectItem value="אסטרטגיה">אסטרטגיה</SelectItem>
                      <SelectItem value="חברתי">חברתי</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ageRange">גיל מומלץ</Label>
                  <Input
                    id="ageRange"
                    value={formData.ageRange}
                    onChange={(e) => handleChange('ageRange', e.target.value)}
                    placeholder="למשל: 5-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform">פלטפורמה/מדיה</Label>
                  <Select value={formData.platform} onValueChange={(value) => handleChange('platform', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר פלטפורמה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="אתר">אתר</SelectItem>
                      <SelectItem value="אפליקציה">אפליקציה</SelectItem>
                      <SelectItem value="משחק לוח">משחק לוח</SelectItem>
                      <SelectItem value="וידאו">וידאו</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">שפת המשחק</Label>
                  <Input
                    id="language"
                    value={formData.language}
                    onChange={(e) => handleChange('language', e.target.value)}
                    placeholder="למשל: עברית"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">משך זמן/אורך</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => handleChange('duration', e.target.value)}
                    placeholder="למשל: 30 דקות"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">דרגת קושי</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => handleChange('difficulty', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר קושי" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="קל">קל</SelectItem>
                      <SelectItem value="בינוני">בינוני</SelectItem>
                      <SelectItem value="קשה">קשה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">יוצר/מחבר</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => handleChange('author', e.target.value)}
                    placeholder="שם היוצר"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publishDate">תאריך פרסום</Label>
                  <Input
                    id="publishDate"
                    type="date"
                    value={formData.publishDate}
                    onChange={(e) => handleChange('publishDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">סטטוס</Label>
                  <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר סטטוס" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">פעיל</SelectItem>
                      <SelectItem value="draft">טיוטה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">מחיר</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating">דירוג</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => handleChange('rating', e.target.value)}
                    placeholder="1-5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">תגיות</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => handleChange('tags', e.target.value)}
                    placeholder="תגיות מופרדות בפסיק"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="images">תמונה/גלריה</Label>
                  <Input
                    id="images"
                    value={formData.images}
                    onChange={(e) => handleChange('images', e.target.value)}
                    placeholder="URL לתמונה או רשימת URLs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">תיאור</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="תאר את המשחק"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructions">הנחיות/כללים</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => handleChange('instructions', e.target.value)}
                  placeholder="הנחיות למשחק"
                  rows={4}
                />
              </div>
              <Button type="submit" className="w-full h-11 text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all">
                שמור משחק
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
