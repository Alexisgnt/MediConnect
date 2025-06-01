import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

const ScheduleManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [isAddVacationModalOpen, setIsAddVacationModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [vacationStartDate, setVacationStartDate] = useState('');
  const [vacationEndDate, setVacationEndDate] = useState('');
  const [vacationReason, setVacationReason] = useState('');
  const [schedule, setSchedule] = useState<any[]>([]);
  const [vacations, setVacations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSchedule();
    fetchVacations();
  }, []);

  const fetchSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', user?.doctor?.id)
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      setSchedule(data || []);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  };

  const fetchVacations = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_vacations')
        .select('*')
        .eq('doctor_id', user?.doctor?.id)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true });

      if (error) throw error;
      setVacations(data || []);
    } catch (error) {
      console.error('Error fetching vacations:', error);
    }
  };

  const addSchedule = async () => {
    try {
      setIsLoading(true);

      const { error } = await supabase.from('doctor_schedules').insert({
        doctor_id: user?.doctor?.id,
        day_of_week: selectedDay,
        start_time: startTime,
        end_time: endTime,
      });

      if (error) throw error;

      setIsAddScheduleModalOpen(false);
      fetchSchedule();
    } catch (error) {
      console.error('Error adding schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addVacation = async () => {
    try {
      setIsLoading(true);

      const { error } = await supabase.from('doctor_vacations').insert({
        doctor_id: user?.doctor?.id,
        start_date: vacationStartDate,
        end_date: vacationEndDate,
        reason: vacationReason,
      });

      if (error) throw error;

      setIsAddVacationModalOpen(false);
      fetchVacations();
    } catch (error) {
      console.error('Error adding vacation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('doctor_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchSchedule();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const deleteVacation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('doctor_vacations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchVacations();
    } catch (error) {
      console.error('Error deleting vacation:', error);
    }
  };

  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-neutral-800">Working Hours</h3>
            <Button
              onClick={() => setIsAddScheduleModalOpen(true)}
              leftIcon={<Plus className="h-5 w-5" />}
              size="sm"
            >
              Add Schedule
            </Button>
          </div>

          <div className="space-y-4">
            {schedule.map((day) => (
              <div key={day.id} className="flex items-center justify-between py-2">
                <div>
                  <span className="font-medium">{getDayName(day.day_of_week)}</span>
                  <div className="text-sm text-neutral-600">
                    {day.start_time} - {day.end_time}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteSchedule(day.id)}
                  leftIcon={<X className="h-4 w-4" />}
                >
                  Remove
                </Button>
              </div>
            ))}

            {schedule.length === 0 && (
              <p className="text-neutral-600">No working hours set</p>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-neutral-800">Vacations</h3>
            <Button
              onClick={() => setIsAddVacationModalOpen(true)}
              leftIcon={<Plus className="h-5 w-5" />}
              size="sm"
            >
              Add Vacation
            </Button>
          </div>

          <div className="space-y-4">
            {vacations.map((vacation) => (
              <div key={vacation.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm text-neutral-600">
                    {format(new Date(vacation.start_date), 'MMM d, yyyy')} -{' '}
                    {format(new Date(vacation.end_date), 'MMM d, yyyy')}
                  </div>
                  {vacation.reason && (
                    <div className="text-sm text-neutral-500">{vacation.reason}</div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteVacation(vacation.id)}
                  leftIcon={<X className="h-4 w-4" />}
                >
                  Remove
                </Button>
              </div>
            ))}

            {vacations.length === 0 && (
              <p className="text-neutral-600">No vacations scheduled</p>
            )}
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isAddScheduleModalOpen}
        onClose={() => setIsAddScheduleModalOpen(false)}
        title="Add Working Hours"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Day of Week
            </label>
            <select
              className="input-field"
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
            >
              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                <option key={day} value={day}>
                  {getDayName(day)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <Input
              label="End Time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setIsAddScheduleModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={addSchedule}
            isLoading={isLoading}
          >
            Add Schedule
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isAddVacationModalOpen}
        onClose={() => setIsAddVacationModalOpen(false)}
        title="Add Vacation"
      >
        <div className="space-y-4">
          <Input
            label="Start Date"
            type="date"
            value={vacationStartDate}
            onChange={(e) => setVacationStartDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
          <Input
            label="End Date"
            type="date"
            value={vacationEndDate}
            onChange={(e) => setVacationEndDate(e.target.value)}
            min={vacationStartDate}
          />
          <Input
            label="Reason (Optional)"
            value={vacationReason}
            onChange={(e) => setVacationReason(e.target.value)}
            placeholder="Enter reason for vacation"
          />
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setIsAddVacationModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={addVacation}
            isLoading={isLoading}
            disabled={!vacationStartDate || !vacationEndDate}
          >
            Add Vacation
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ScheduleManagement;