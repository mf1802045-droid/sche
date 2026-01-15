
import { Staff, WorkItem } from './types';

export const STAFF_LIST: Staff[] = [
  { id: '1', name: '李婷', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces', tag: '自有员工' },
  { id: '2', name: '张云', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces' },
  { id: '3', name: '陈曦', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces' },
  { id: '4', name: '徐春燕', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&crop=faces' },
  { id: '5', name: '', avatar: '', tag: 'ADD' }
];

export const TIME_SLOTS = [
  '8~9', '9~10', '10~11', '11~12', '12~13', '13~14', '14~15'
];

export const WORK_ITEMS: WorkItem[] = [
  { id: '1', label: '摇杯', color: 'bg-emerald-50' },
  { id: '2', label: '出杯', color: 'bg-orange-50' },
  { id: '3', label: '后厨', color: 'bg-blue-50' },
  { id: '4', label: '机动', color: 'bg-sky-50' },
  { id: '5', label: '打烊', color: 'bg-yellow-50' },
  { id: '6', label: '保洁', color: 'bg-purple-50' },
  { id: '7', label: '休息', color: 'bg-gray-50' },
  { id: '8', label: '上班', color: 'bg-gray-100' },
  { id: '9', label: '开台', color: 'bg-red-50' },
];
