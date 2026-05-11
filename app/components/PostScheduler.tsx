'use client';

import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Clock, Calendar as CalendarIcon, CheckCircle } from 'lucide-react';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface PostSchedulerProps {
  onSchedule: (date: Date, platform: string) => void;
  platforms: Array<{ id: string; name: string; color: string; icon: any }>;
  isScheduling: boolean;
  initialDate?: Date;
}

export default function PostScheduler({ 
  onSchedule, 
  platforms, 
  isScheduling,
  initialDate = new Date() 
}: PostSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [selectedTime, setSelectedTime] = useState<string>('10:00');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Générer des créneaux horaires
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  const handleSchedule = (platformId: string) => {
    const dateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    dateTime.setHours(parseInt(hours), parseInt(minutes), 0);
    onSchedule(dateTime, platformId);
    setSelectedPlatform(platformId);
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      if (date < new Date()) {
        return <div className="text-gray-300 text-xs">📅</div>;
      }
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Aperçu de la date sélectionnée */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Publication prévue</p>
            <p className="text-lg font-semibold text-gray-900">
              {selectedDate.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </p>
            <p className="text-blue-600 font-medium">{selectedTime}</p>
          </div>
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Calendrier */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <button
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
        >
          <span className="font-medium text-gray-700">
            {isCalendarOpen ? 'Fermer le calendrier' : 'Choisir une date'}
          </span>
          <CalendarIcon className="w-4 h-4 text-gray-500" />
        </button>

        {isCalendarOpen && (
          <div className="mt-4">
            <Calendar
              onChange={(value) => {
                if (value instanceof Date) {
                  setSelectedDate(value);
                  setIsCalendarOpen(false);
                }
              }}
              value={selectedDate}
              minDate={new Date()}
              tileContent={tileContent}
              locale="fr-FR"
              className="border-0 shadow-none"
            />
          </div>
        )}
      </div>

      {/* Sélecteur d'heure */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          Choisir l'heure
        </label>
        <div className="grid grid-cols-3 gap-2">
          {timeSlots.map((time) => (
            <button
              key={time}
              onClick={() => setSelectedTime(time)}
              className={`py-2 rounded-lg text-sm transition ${
                selectedTime === time
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      {/* Boutons des plateformes */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 mb-2">Programmer sur :</p>
        <div className="grid grid-cols-2 gap-3">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const isSchedulingThis = selectedPlatform === platform.id && isScheduling;
            
            return (
              <button
                key={platform.id}
                onClick={() => handleSchedule(platform.id)}
                disabled={isScheduling}
                className={`${platform.color} text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-50`}
              >
                {isSchedulingThis ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Icon className="w-5 h-5" />
                    {platform.name}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}