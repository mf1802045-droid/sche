
import React, { useState, useRef, useEffect } from 'react';
import { STAFF_LIST, TIME_SLOTS, WORK_ITEMS } from './constants';
import { Staff } from './types';

const App: React.FC = () => {
  const [staffRows, setStaffRows] = useState<Staff[]>(STAFF_LIST.filter(s => s.tag !== 'ADD'));
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<Record<string, { workId: string; confirmed: boolean }>>({}); 
  const [history, setHistory] = useState<Record<string, { workId: string; confirmed: boolean }>[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [animatingKey, setAnimatingKey] = useState<string | null>(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [activeStaffTarget, setActiveStaffTarget] = useState<string | null>(null);
  
  const longPressTimer = useRef<number | null>(null);
  const dragStarted = useRef(false);
  const hasJustApplied = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const getCellKey = (staffId: string, timeIdx: number) => `${staffId}-${timeIdx}`;
  const FULL_TIME_SLOTS = Array.from({ length: 24 }, (_, i) => `${i}~${i + 1}`);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const cellWidth = 64; 
      const scrollOffset = 8 * cellWidth;
      scrollContainerRef.current.scrollLeft = scrollOffset;
    }
  }, []);

  useEffect(() => {
    if (selectedCells.length === 0) {
      setIsPanelOpen(false);
    }
  }, [selectedCells]);

  const getFusingClasses = (staffId: string, timeIdx: number) => {
    const key = getCellKey(staffId, timeIdx);
    if (!selectedCells.includes(key)) return "";
    let classes = "";
    if (selectedCells.includes(getCellKey(staffId, timeIdx - 1))) classes += " sel-left";
    if (selectedCells.includes(getCellKey(staffId, timeIdx + 1))) classes += " sel-right";
    const sIdx = staffRows.findIndex(s => s.id === staffId);
    if (sIdx > 0 && selectedCells.includes(getCellKey(staffRows[sIdx - 1].id, timeIdx))) classes += " sel-top";
    if (sIdx < staffRows.length - 1 && selectedCells.includes(getCellKey(staffRows[sIdx + 1].id, timeIdx))) classes += " sel-bottom";
    return classes;
  };

  const handleCellSelection = (staffId: string, timeIdx: number) => {
    const key = getCellKey(staffId, timeIdx);
    const staff = staffRows.find(s => s.id === staffId);
    
    if (staff && (!staff.name || staff.name.trim() === "")) {
      setActiveStaffTarget(staffId);
      setIsStaffModalOpen(true);
      return;
    }

    setSelectedCells(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      }
      if (hasJustApplied.current) {
        hasJustApplied.current = false;
        setIsPanelOpen(true);
        return [key];
      }
      setIsPanelOpen(true);
      return [...prev, key];
    });
  };

  const startDragging = (staffId: string, timeIdx: number) => {
    const staff = staffRows.find(s => s.id === staffId);
    if (staff && (!staff.name || staff.name.trim() === "")) return;

    const key = getCellKey(staffId, timeIdx);
    setIsDragging(true);
    dragStarted.current = true;
    setAnimatingKey(key);
    setTimeout(() => setAnimatingKey(null), 400);
    
    setSelectedCells(prev => {
      if (hasJustApplied.current) {
        hasJustApplied.current = false;
        return [key];
      }
      return prev.includes(key) ? prev : [...prev, key];
    });
    setIsPanelOpen(true);
  };

  const assignStaffToRow = (newStaffData: Partial<Staff>) => {
    if (!activeStaffTarget) return;
    setStaffRows(prev => prev.map(s => s.id === activeStaffTarget ? { ...s, ...newStaffData } : s));
    setIsStaffModalOpen(false);
    setActiveStaffTarget(null);
  };

  const addNewRow = () => {
    const newId = `new-${Date.now()}`;
    setStaffRows(prev => [...prev, { id: newId, name: '', avatar: '', tag: '' }]);
  };

  const handleMouseDown = (staffId: string, timeIdx: number) => {
    longPressTimer.current = window.setTimeout(() => startDragging(staffId, timeIdx), 500);
  };

  const handleMouseEnter = (staffId: string, timeIdx: number) => {
    if (!isDragging) return;
    const staff = staffRows.find(s => s.id === staffId);
    if (staff && (!staff.name || staff.name.trim() === "")) return;
    const key = getCellKey(staffId, timeIdx);
    setSelectedCells(prev => prev.includes(key) ? prev : [...prev, key]);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsDragging(false);
  };

  const handleClick = (staffId: string, timeIdx: number, e: React.MouseEvent) => {
    if (!dragStarted.current) handleCellSelection(staffId, timeIdx);
    dragStarted.current = false;
  };

  const handleTouchStart = (staffId: string, timeIdx: number) => {
    dragStarted.current = false;
    longPressTimer.current = window.setTimeout(() => startDragging(staffId, timeIdx), 500);
  };

  const applyWork = (workId: string | null) => {
    setHistory(prev => [...prev, { ...schedule }]);
    const newSchedule = { ...schedule };
    selectedCells.forEach(key => {
      if (workId === null) {
        delete newSchedule[key];
      } else {
        newSchedule[key] = { workId, confirmed: false };
      }
    });
    setSchedule(newSchedule);
    hasJustApplied.current = true;
  };

  const confirmAllShifts = () => {
    setHistory(prev => [...prev, { ...schedule }]);
    const newSchedule = { ...schedule };
    Object.keys(newSchedule).forEach(key => {
      const staffId = key.split('-')[0];
      const staff = staffRows.find(s => s.id === staffId);
      if (staff && staff.name && staff.name.trim() !== "") {
        newSchedule[key] = { ...newSchedule[key], confirmed: true };
      }
    });
    setSchedule(newSchedule);
    setSelectedCells([]);
  };

  const undoAction = () => {
    if (history.length === 0) return;
    setSchedule(history[history.length - 1]);
    setHistory(prev => prev.slice(0, -1));
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setSelectedCells([]);
    hasJustApplied.current = false;
  };

  const totalRevenue = FULL_TIME_SLOTS.length * 400; 
  const scheduleEntries = Object.entries(schedule);
  const scheduledStaffIds = new Set<string>();
  const unconfirmedStaffIds = new Set<string>();
  const emptyStaffIdsWithWork = new Set<string>();
  let totalHours = 0;

  scheduleEntries.forEach(([key, val]) => {
    const entry = val as { workId: string; confirmed: boolean };
    const staffId = key.split('-')[0];
    const staff = staffRows.find(s => s.id === staffId);
    
    if (entry && entry.workId) {
      if (staff && staff.name && staff.name.trim() !== "") {
        scheduledStaffIds.add(staffId);
        totalHours += 1;
        if (!entry.confirmed) unconfirmedStaffIds.add(staffId);
      } else {
        emptyStaffIdsWithWork.add(staffId);
      }
    }
  });

  const efficiency = totalHours > 0 ? Math.round(totalRevenue / totalHours) : null;
  const activeStaffCount = scheduledStaffIds.size;
  const unconfirmedStaffCount = unconfirmedStaffIds.size;

  return (
    <div id="app-container" onMouseUp={handleMouseUp} onTouchEnd={handleMouseUp}>
      <div className="bg-white z-30 shadow-sm">
        <div className="px-6 pt-4 flex justify-between items-center text-xs font-bold">
          <span>9:41</span>
          <div className="flex space-x-1 items-center">
            <i className="fas fa-signal"></i><i className="fas fa-wifi"></i><i className="fas fa-battery-full text-lg"></i>
          </div>
        </div>
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <i className="fas fa-chevron-left text-xl"></i>
            <div>
              <h1 className="text-lg font-bold">青团咖啡金之源店</h1>
              <div className="flex items-center text-xs text-gray-500"><span>青团咖啡</span><i className="fas fa-caret-down ml-1"></i></div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium"><span>日</span><span className="text-[10px] ml-0.5 text-gray-400">周</span></div>
            <i className="fas fa-ellipsis-h text-gray-600"></i>
            <div className="w-8 h-8 rounded-full border-2 border-gray-900 p-0.5"><div className="w-full h-full rounded-full bg-black"></div></div>
          </div>
        </div>
        <div className="px-4 py-3 flex justify-between items-end border-b border-gray-50">
          <div className="text-center">
            <div className="text-[10px] text-gray-400 font-medium">2025</div>
            <div className="text-lg font-bold flex items-center">4月<i className="fas fa-caret-down text-[10px] ml-1"></i></div>
          </div>
          {[{ label: '一', d: 28 }, { label: '二', d: '今' }, { label: '三', d: 30 }, { label: '四', d: 1 }, { label: '五', d: 2 }, { label: '六', d: 3, active: true }, { label: '日', d: 4 }].map((item, i) => (
            <div key={i} className="text-center flex flex-col items-center">
              <span className="text-[10px] mb-1 font-bold">{item.label}</span>
              <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${item.active ? 'bg-gray-800 text-white' : ''}`}>{item.d}</div>
            </div>
          ))}
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-auto custom-scrollbar relative bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-white text-[10px] text-[#595D6A]">
              <th className="sticky left-0 top-0 bg-white z-40 p-0 border border-gray-100 min-w-[70px]">
                <div className="h-4 flex items-center pl-2 space-x-1"><i className="fas fa-yen-sign"></i><span>预估流水</span></div>
                <div className="border-t border-gray-100 w-full"></div>
                <div className="h-4 flex items-center pl-2 space-x-1"><i className="far fa-clock"></i><span>时间</span></div>
              </th>
              {FULL_TIME_SLOTS.map((slot, i) => (
                <th key={i} className="sticky top-0 bg-white p-0 border border-gray-100 min-w-[64px] z-30 font-normal">
                  <div className="h-4 flex items-center justify-center">400</div>
                  <div className="border-t border-gray-100 w-full"></div>
                  <div className="h-4 flex items-center justify-center">{slot}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staffRows.map((staff) => {
              const isEmptyStaff = !staff.name || staff.name.trim() === "";
              const hasWorkButNoPerson = isEmptyStaff && emptyStaffIdsWithWork.has(staff.id);
              const hasUnconfirmedInRow = unconfirmedStaffIds.has(staff.id);
              return (
                <tr key={staff.id}>
                  <td className="sticky left-0 bg-white z-20 border border-gray-100 p-0 text-center relative h-[76.8px]">
                    <div className="flex flex-col items-center justify-center h-full relative">
                      {hasWorkButNoPerson ? <div className="no-person-tag">无人员</div> : hasUnconfirmedInRow ? <div className="pending-tag">待确认</div> : null}
                      {isEmptyStaff ? (
                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400"><i className="fas fa-user-plus"></i></div>
                      ) : (
                        <div className="relative mt-1">
                          <img src={staff.avatar} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                          {staff.tag && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-blue-600 text-[8px] text-white px-1 rounded whitespace-nowrap">{staff.tag}</span>}
                        </div>
                      )}
                      <span className="text-[11px] font-medium mt-1">{staff.name || '添加人员'}</span>
                    </div>
                  </td>
                  {FULL_TIME_SLOTS.map((_, tIdx) => {
                    const key = getCellKey(staff.id, tIdx);
                    const isSelected = selectedCells.includes(key);
                    const entry = schedule[key];
                    const work = entry ? WORK_ITEMS.find(w => w.id === entry.workId) : null;
                    const showUnconfirmedUI = work && (hasUnconfirmedInRow || hasWorkButNoPerson);
                    return (
                      <td 
                        key={tIdx} data-cell-key={key} style={{ height: '76.8px' }}
                        className={`border border-gray-100 relative ${work ? work.color : ''} ${isSelected ? 'grid-cell-selected' : ''} ${showUnconfirmedUI ? `unconfirmed-pattern unconfirmed-border border-unconfirmed-${work?.color?.split('-')[1]}` : ''}`}
                        onMouseDown={() => handleMouseDown(staff.id, tIdx)} onMouseEnter={() => handleMouseEnter(staff.id, tIdx)}
                        onTouchStart={() => handleTouchStart(staff.id, tIdx)} onClick={(e) => handleClick(staff.id, tIdx, e)}
                      >
                        {isSelected && <div className={`selection-overlay ${getFusingClasses(staff.id, tIdx)} ${animatingKey === key ? 'animate-pulse-selection' : ''}`} />}
                        {work && <div className={`absolute inset-0 flex items-center justify-center text-[13.2px] ${showUnconfirmedUI ? `text-unconfirmed-${work.color.split('-')[1]}` : 'text-gray-700'} pointer-events-none z-20`}>{work.label}</div>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr><td colSpan={FULL_TIME_SLOTS.length + 1} className="p-4 flex justify-center bg-gray-50/30">
                <button onClick={addNewRow} className="flex items-center space-x-2 text-gray-500 font-medium py-2 px-6 border-2 border-dashed border-gray-200 rounded-full active:bg-gray-100 transition-colors"><i className="fas fa-plus"></i><span>新增行</span></button>
            </td></tr>
            <tr><td colSpan={FULL_TIME_SLOTS.length + 1} className="h-64"></td></tr>
          </tbody>
        </table>
      </div>

      <div className="fixed bottom-0 left-0 right-0 flex flex-col pointer-events-none z-[100]">
        <div className="flex gap-4 items-center justify-center py-2 px-4 pointer-events-auto">
          {[{ icon: 'fa-undo', action: undoAction }, { icon: 'fa-list-ul' }, { icon: 'fa-search' }, { icon: 'fa-clock', label: '1h' }, { icon: 'fa-cog' }, { icon: 'fa-plus', action: addNewRow }].map((btn, i) => (
            <div key={i} onClick={() => btn.action?.()} className="w-11 h-11 rounded-full border border-gray-100 bg-white shadow-lg flex items-center justify-center text-gray-700 active:bg-gray-50 backdrop-blur-sm">
              {btn.label ? <div className="flex flex-col items-center"><span className="font-bold text-[10px] mb-0.5">{btn.label}</span><div className="w-2.5 h-0.5 bg-black rounded"></div></div> : <i className={`fas ${btn.icon} text-sm`}></i>}
            </div>
          ))}
        </div>

        <div className={`overflow-hidden transition-all duration-300 pointer-events-auto ${isPanelOpen ? 'max-h-[400px]' : 'max-h-0'}`}>
          <div className="bg-white px-4 pb-4 border-t border-gray-100 shadow-lg">
             <div className="flex justify-between items-center py-2 px-2">
               <i className="fas fa-chevron-down text-gray-400 p-1.5" onClick={closePanel}></i>
               <div className="flex bg-gray-100 rounded-full p-0.5 w-36">
                 <div className="flex-1 text-center py-1 rounded-full bg-white text-[10px] font-bold shadow-sm">工作内容</div>
                 <div className="flex-1 text-center py-1 text-[10px] text-gray-500">班次</div>
               </div>
               <i className="far fa-edit text-gray-600 p-1.5"></i>
             </div>
             <div className="grid grid-cols-4 gap-3 mt-2">
                <div className="col-span-1 border-2 border-dashed border-gray-200 rounded-2xl h-12 flex items-center justify-center text-gray-300"><i className="fas fa-plus"></i></div>
                <div onClick={() => applyWork(null)} className="col-span-1 bg-gray-50 rounded-2xl h-12 flex items-center justify-center text-gray-600 text-sm space-x-1"><i className="fas fa-eraser"></i><span>清除</span></div>
                {WORK_ITEMS.map((item) => (
                  <div key={item.id} onClick={() => applyWork(item.id)} className={`flex items-center justify-center rounded-2xl h-12 text-sm ${item.color} text-unconfirmed-${item.color.split('-')[1]} active:scale-95 transition-transform`}>{item.label}</div>
                ))}
             </div>
          </div>
        </div>

        <div className="h-[76px] bg-[#F4F5F6] border-t border-gray-100 px-4 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center h-full">
             <div className={`w-14 h-14 rounded-full border-4 ${efficiency ? 'border-emerald-500' : 'border-gray-300'} flex flex-col items-center justify-center`}>
                <span className={`text-xl font-bold leading-tight ${efficiency ? 'text-black' : 'text-gray-400'}`}>{efficiency || '--'}</span>
                <span className="text-[8px] text-gray-400">人效</span>
             </div>
             <div className="w-[1px] h-8 bg-gray-200 mx-4"></div>
             <div className="text-sm">
                <div className="flex space-x-2"><span className="text-gray-400">排班:</span><span className="font-bold">{activeStaffCount}</span></div>
                <div className="flex space-x-2"><span className="text-gray-400">工时:</span><span className="font-bold">{totalHours}h</span></div>
             </div>
          </div>
          <div className="flex items-center space-x-4">
            {unconfirmedStaffCount > 0 && <span className="text-gray-500 text-[12px]">{unconfirmedStaffCount}个待确认</span>}
            {unconfirmedStaffCount > 0 ? (
              <button onClick={confirmAllShifts} className="bg-[#19C1AD] h-14 text-white px-8 rounded-xl font-bold text-lg active:scale-95 transition-transform">确认排班</button>
            ) : (
              <div className="flex flex-col items-center text-gray-400"><i className="far fa-copy text-xl"></i><span className="text-[10px] mt-1">复用上周六</span></div>
            )}
          </div>
        </div>
      </div>

      {isStaffModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-4">选择人员</h3>
            <div className="grid grid-cols-3 gap-4">
              {[{ name: '王嘉尔', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=faces', tag: '店长' }, { name: '肖战', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces', tag: '全职' }, { name: '迪丽热巴', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces', tag: '兼职' }, { name: '周杰伦', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=faces', tag: '自有员工' }, { name: '易烊千玺', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces', tag: '自有员工' }].map((p, i) => (
                <div key={i} onClick={() => assignStaffToRow(p)} className="flex flex-col items-center p-2 rounded-2xl active:bg-gray-50 transition-all cursor-pointer">
                  <img src={p.avatar} className="w-12 h-12 rounded-full mb-2 object-cover shadow-sm" /><span className="text-xs font-bold text-center truncate w-full">{p.name}</span><span className="text-[8px] text-gray-400">{p.tag}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setIsStaffModalOpen(false)} className="w-full mt-6 py-3 bg-gray-100 rounded-xl font-bold">取消</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
