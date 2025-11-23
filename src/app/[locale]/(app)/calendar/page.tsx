import HebrewCalendar from '@/components/calendar/HebrewCalendar';

export default function CalendarPage() {
  return (
    <div className="container mx-auto p-6">
      <HebrewCalendar language="he" showBothLanguages={true} />
    </div>
  );
}
