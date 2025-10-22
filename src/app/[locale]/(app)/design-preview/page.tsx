import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Users,
  DollarSign,
  Heart,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Award,
  Target
} from 'lucide-react';

export default async function DesignPreviewPage() {

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          Design System Preview
        </h1>
        <p className="text-lg text-muted-foreground">
          שתי גרסאות לבחירה - שניהם מקצועיות ועשירות ויזואלית
        </p>
      </div>

      {/* Version A - Professional Blue with Rich Gradients */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Badge variant="default" className="text-sm px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700">
            גרסה A - כחול מקצועי עם גרדיאנטים
          </Badge>
          <p className="text-sm text-muted-foreground">צבעים עשירים, עומק ויזואלי, מודרני מאוד</p>
        </div>

        {/* Stats Grid - Version A */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 - Blue Gradient */}
          <Card className="relative overflow-hidden border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-blue-50/50 to-transparent opacity-60" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-blue-900">
                סה״כ תיקים
              </CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-blue-900">248</div>
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +12% מהחודש שעבר
              </p>
            </CardContent>
          </Card>

          {/* Card 2 - Green Gradient */}
          <Card className="relative overflow-hidden border-2 border-green-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-green-50/50 to-transparent opacity-60" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-green-900">
                פעילים
              </CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-green-900">156</div>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <Award className="h-3 w-3" />
                62.9% מהתיקים
              </p>
            </CardContent>
          </Card>

          {/* Card 3 - Amber Gradient */}
          <Card className="relative overflow-hidden border-2 border-amber-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-amber-50/50 to-transparent opacity-60" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-amber-900">
                ממתינים
              </CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-amber-900">67</div>
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                דורש תשומת לב
              </p>
            </CardContent>
          </Card>

          {/* Card 4 - Purple Gradient */}
          <Card className="relative overflow-hidden border-2 border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-purple-50/50 to-transparent opacity-60" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-purple-900">
                סכום מועבר
              </CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-purple-900">₪2.4M</div>
              <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                <Target className="h-3 w-3" />
                85% מהיעד השנתי
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons - Version A */}
        <Card className="shadow-lg border-2">
          <CardHeader>
            <CardTitle className="text-xl">כפתורים ופעולות</CardTitle>
            <CardDescription>סגנונות שונים של כפתורים</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all">
                <Heart className="h-4 w-4 me-2" />
                תיק חתונה חדש
              </Button>
              <Button variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold">
                <Users className="h-4 w-4 me-2" />
                ניקוי מקדש
              </Button>
              <Button variant="outline" className="border-2 border-green-600 text-green-600 hover:bg-green-50 font-semibold">
                <CheckCircle2 className="h-4 w-4 me-2" />
                אישור בקשה
              </Button>
              <Button variant="outline" className="border-2 border-amber-600 text-amber-600 hover:bg-amber-50 font-semibold">
                <Calendar className="h-4 w-4 me-2" />
                תזמון פגישה
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1">חדש</Badge>
              <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1">אושר</Badge>
              <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1">ממתין</Badge>
              <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1">דחוף</Badge>
              <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1">VIP</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border-t-4 border-dashed border-gray-300 pt-8" />

      {/* Version B - Softer Professional with Subtle Depth */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-sm px-4 py-1.5 bg-gradient-to-r from-slate-600 to-slate-700 text-white">
            גרסה B - מקצועי רך עם עומק עדין
          </Badge>
          <p className="text-sm text-muted-foreground">צבעים רכים יותר, אלגנטי, נגיש</p>
        </div>

        {/* Stats Grid - Version B */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 - Soft Blue */}
          <Card className="relative overflow-hidden border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">
                סה״כ תיקים
              </CardTitle>
              <div className="h-11 w-11 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-200">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">248</div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-blue-500" />
                <span className="text-blue-600 font-medium">+12%</span> מהחודש שעבר
              </p>
            </CardContent>
          </Card>

          {/* Card 2 - Soft Green */}
          <Card className="relative overflow-hidden border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-emerald-50/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">
                פעילים
              </CardTitle>
              <div className="h-11 w-11 rounded-lg bg-emerald-100 flex items-center justify-center border border-emerald-200">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">156</div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Award className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600 font-medium">62.9%</span> מהתיקים
              </p>
            </CardContent>
          </Card>

          {/* Card 3 - Soft Amber */}
          <Card className="relative overflow-hidden border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-orange-50/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">
                ממתינים
              </CardTitle>
              <div className="h-11 w-11 rounded-lg bg-orange-100 flex items-center justify-center border border-orange-200">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">67</div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-orange-500" />
                <span className="text-orange-600 font-medium">דורש</span> תשומת לב
              </p>
            </CardContent>
          </Card>

          {/* Card 4 - Soft Indigo */}
          <Card className="relative overflow-hidden border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-indigo-50/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">
                סכום מועבר
              </CardTitle>
              <div className="h-11 w-11 rounded-lg bg-indigo-100 flex items-center justify-center border border-indigo-200">
                <DollarSign className="h-5 w-5 text-indigo-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">₪2.4M</div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Target className="h-3 w-3 text-indigo-500" />
                <span className="text-indigo-600 font-medium">85%</span> מהיעד השנתי
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons - Version B */}
        <Card className="shadow-md border border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">כפתורים ופעולות</CardTitle>
            <CardDescription className="text-slate-600">סגנונות שונים של כפתורים</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all">
                <Heart className="h-4 w-4 me-2" />
                תיק חתונה חדש
              </Button>
              <Button variant="outline" className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 font-medium">
                <Users className="h-4 w-4 me-2" />
                ניקוי מקדש
              </Button>
              <Button variant="outline" className="border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 font-medium">
                <CheckCircle2 className="h-4 w-4 me-2" />
                אישור בקשה
              </Button>
              <Button variant="outline" className="border-2 border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 font-medium">
                <Calendar className="h-4 w-4 me-2" />
                תזמון פגישה
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 font-medium">חדש</Badge>
              <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 font-medium">אושר</Badge>
              <Badge className="bg-orange-100 text-orange-700 border border-orange-200 px-3 py-1 font-medium">ממתין</Badge>
              <Badge className="bg-red-100 text-red-700 border border-red-200 px-3 py-1 font-medium">דחוף</Badge>
              <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1 font-medium">VIP</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Summary */}
      <Card className="border-2 border-blue-200 shadow-xl bg-gradient-to-br from-blue-50/50 to-white">
        <CardHeader>
          <CardTitle className="text-2xl">סיכום השוואה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-blue-900">✨ גרסה A - עשיר ודינמי</h3>
              <ul className="space-y-1.5 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>גרדיאנטים עשירים וצבעוניים</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>צללים חזקים יותר - עומק ויזואלי ברור</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>מודרני מאוד - מתאים לסטארטאפים וטכנולוגיה</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>משיכת תשומת לב חזקה</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-slate-900">🎯 גרסה B - אלגנטי ונגיש</h3>
              <ul className="space-y-1.5 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>צבעים רכים יותר - נעים לעין לזמן ארוך</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>עומק עדין - פחות דרמטי אבל מקצועי</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>נגישות מעולה - קל לקריאה</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>מתאים יותר לסביבת משרד מסורתית</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t mt-6">
            <p className="text-sm text-slate-600">
              💡 <strong>המלצה:</strong> שתי הגרסאות מקצועיות ועשירות ויזואלית. גרסה A מתאימה למערכת דינמית ומודרנית,
              גרסה B מתאימה יותר לסביבה משרדית שמרנית. שניהם בעלות היררכיה ברורה וקריאות מעולה.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
