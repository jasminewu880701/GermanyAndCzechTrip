"use client";
import React, { useState, useEffect } from 'react';
import { MapPin, Sun, Plus, CloudRain, Sunset, Navigation, Hotel, Clock, Info, Save, Edit3, Trash2, Car, Castle, UtensilsCrossed, CheckCircle2, GripVertical } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// 引入 DND 套件
import { DndContext, closestCenter, TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DATES = (() => {
  const dates = [];
  let curr = new Date("2026-02-14");
  while (curr <= new Date("2026-03-01")) {
    dates.push(new Date(curr).toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
})();

// --- 可拖拽項目組件 ---
function SortableItem(props: any) {
  const { item, editingId, setEditingId, getIcon, handleUpdate, handleDelete } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {editingId === item.id ? (
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-orange-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-black text-orange-500 italic">EDITING</span>
            <button onClick={() => setEditingId(null)} className="text-orange-600"><Save className="w-6 h-6"/></button>
          </div>
          <div className="space-y-4">
            <input className="w-full p-4 bg-gray-50 rounded-2xl text-lg" value={item.time} onChange={(e) => handleUpdate(item.id, 'time', e.target.value)} placeholder="時間" />
            <input className="w-full p-4 bg-gray-50 rounded-2xl text-lg font-bold" value={item.location} onChange={(e) => handleUpdate(item.id, 'location', e.target.value)} placeholder="目的地" />
            <textarea className="w-full p-4 bg-gray-50 rounded-2xl text-base h-24" value={item.note} onChange={(e) => handleUpdate(item.id, 'note', e.target.value)} placeholder="備註..." />
            <button onClick={() => handleDelete(item.id)} className="w-full py-4 text-red-500 font-bold bg-red-50 rounded-2xl flex items-center justify-center gap-2"><Trash2 className="w-5 h-5"/> 刪除</button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-orange-50 active:scale-95 transition-transform flex items-center gap-2" onClick={() => setEditingId(item.id)}>
          {/* 拖拽把手 - 放在左側 */}
          <div {...attributes} {...listeners} className="p-2 text-gray-200 cursor-grab active:cursor-grabbing">
            <GripVertical className="w-6 h-6" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {getIcon(item.type)}
              <span className="text-lg font-black text-orange-600">{item.time}</span>
            </div>
            <h3 className="text-xl font-black text-gray-900 leading-tight mb-1">{item.location}</h3>
            <div className="bg-[#FFF9F2] p-5 rounded-2xl mb-4 text-base text-gray-600 leading-relaxed whitespace-pre-line">{item.note}</div>
            <div className="flex justify-end">
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`} target="_blank" onClick={(e) => e.stopPropagation()} 
                className="bg-orange-500 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-lg flex items-center gap-2">
                <Navigation className="w-4 h-4"/> 導航
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TravelApp() {
  const [selectedDate, setSelectedDate] = useState(DATES[0]);
  const [editingId, setEditingId] = useState(null);
  const [isEditAcc, setIsEditAcc] = useState(false);
  const [itineraries, setItineraries] = useState<any>({});

  // 觸控感應設定
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 5 } })
  );

  const currentDay = itineraries[selectedDate] || { events: [], acc: { name: "", addr: "" } };

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('itineraries').select('*').eq('date', selectedDate).single();
      if (data && data.events) {
        setItineraries((prev: any) => ({ ...prev, [selectedDate]: data.events }));
      }
    }
    fetchData();
  }, [selectedDate]);

  const saveToDB = async (updatedData: any) => {
    await supabase.from('itineraries').upsert({ date: selectedDate, events: updatedData }, { onConflict: 'date' });
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = currentDay.events.findIndex((item: any) => item.id === active.id);
      const newIndex = currentDay.events.findIndex((item: any) => item.id === over.id);
      const newEvents = arrayMove(currentDay.events, oldIndex, newIndex);
      const updatedDay = { ...currentDay, events: newEvents };
      setItineraries({ ...itineraries, [selectedDate]: updatedDay });
      saveToDB(updatedDay);
    }
  };

  const handleUpdateAcc = async (field: string, value: any) => {
    const updatedDay = { ...currentDay, acc: { ...(currentDay.acc || {}), [field]: value } };
    setItineraries({ ...itineraries, [selectedDate]: updatedDay });
    await saveToDB(updatedDay);
  };

  const handleAdd = async (type: string) => {
    const newId = Date.now();
    const newEvent = { id: newId, type, time: "12:00", start: "出發", location: "新行程", note: "", info: "" };
    const updatedDay = { ...currentDay, events: [...(currentDay.events || []), newEvent] };
    setItineraries({ ...itineraries, [selectedDate]: updatedDay });
    setEditingId(newId as any);
    await saveToDB(updatedDay);
  };

  const handleUpdate = async (id: any, field: string, value: string) => {
    const updatedEvents = (currentDay.events || []).map((e: any) => e.id === id ? { ...e, [field]: value } : e);
    const updatedDay = { ...currentDay, events: updatedEvents };
    setItineraries({ ...itineraries, [selectedDate]: updatedDay });
    await saveToDB(updatedDay);
  };

  const handleDelete = async (id: any) => {
    if (confirm("確定刪除？")) {
      const updatedEvents = (currentDay.events || []).filter((e: any) => e.id !== id);
      const updatedDay = { ...currentDay, events: updatedEvents };
      setItineraries({ ...itineraries, [selectedDate]: updatedDay });
      await saveToDB(updatedDay);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'transport': return <Car className="w-6 h-6 text-blue-500" />;
      case 'spot': return <Castle className="w-6 h-6 text-orange-600" />;
      case 'food': return <UtensilsCrossed className="w-6 h-6 text-green-600" />;
      default: return <MapPin className="w-6 h-6 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFAF0] pb-40 font-sans antialiased">
      {/* 頂部日期選單 */}
      <div className="sticky top-0 z-50 bg-[#FFFAF0]/95 backdrop-blur-md border-b border-orange-100">
        <div className="flex overflow-x-auto py-5 px-4 gap-4 no-scrollbar">
          {DATES.map((date, idx) => (
            <button key={date} onClick={() => setSelectedDate(date)}
              className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${
                selectedDate === date ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-orange-800'
              }`}>
              <span className="text-[10px] font-bold">Day {idx + 1}</span>
              <span className="text-xl font-black">{date.split('-')[1]}/{date.split('-')[2]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 mt-4">
        {/* 住宿編輯 */}
        <div className="py-2">
          {isEditAcc ? (
            <div className="bg-white p-5 rounded-3xl shadow-xl border border-orange-200 space-y-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-black text-orange-500 font-black">STAY INFO</span>
                <button onClick={() => setIsEditAcc(false)} className="text-orange-600"><Save className="w-6 h-6"/></button>
              </div>
              <input className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold" placeholder="飯店名稱" value={currentDay.acc?.name || ""} onChange={(e)=>handleUpdateAcc('name', e.target.value)} />
              <input className="w-full p-3 bg-gray-50 rounded-xl text-xs" placeholder="地址" value={currentDay.acc?.addr || ""} onChange={(e)=>handleUpdateAcc('addr', e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <input className="p-3 bg-gray-50 rounded-xl text-xs" placeholder="Check-in" value={currentDay.acc?.checkIn || ""} onChange={(e)=>handleUpdateAcc('checkIn', e.target.value)} />
                <input className="p-3 bg-gray-50 rounded-xl text-xs" placeholder="Check-out" value={currentDay.acc?.checkOut || ""} onChange={(e)=>handleUpdateAcc('checkOut', e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {[{k:'laundry',l:'洗衣服'},{k:'kitchen',l:'廚房'},{k:'luggage',l:'寄行李'}].map((i) => (
                  <button key={i.k} onClick={() => handleUpdateAcc(i.k, !currentDay.acc?.[i.k])}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold ${currentDay.acc?.[i.k] ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {i.l}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Hotel className="w-5 h-5 text-orange-500"/>
                  <span className="text-base font-black text-gray-800 truncate">{currentDay.acc?.name || "尚未設定住宿"}</span>
                  <button onClick={() => setIsEditAcc(true)} className="text-orange-300 p-1"><Edit3 className="w-4 h-4"/></button>
                </div>
                {currentDay.acc?.name && (
                  <div className="ml-7 mt-1 space-y-1.5">
                    <p className="text-xs text-gray-400 truncate">{currentDay.acc?.addr}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {currentDay.acc?.checkIn && <span className="text-[9px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded font-bold">In: {currentDay.acc.checkIn}</span>}
                      {currentDay.acc?.laundry && <span className="text-[9px] text-blue-500 flex items-center gap-0.5 font-bold"><CheckCircle2 className="w-2.5 h-2.5"/> 洗衣</span>}
                      {currentDay.acc?.kitchen && <span className="text-[9px] text-green-600 flex items-center gap-0.5 font-bold"><CheckCircle2 className="w-2.5 h-2.5"/> 廚房</span>}
                      {currentDay.acc?.luggage && <span className="text-[9px] text-orange-500 flex items-center gap-0.5 font-bold"><CheckCircle2 className="w-2.5 h-2.5"/> 寄行李</span>}
                    </div>
                  </div>
                )}
              </div>
              {currentDay.acc?.addr && (
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentDay.acc.addr)}`} target="_blank"
                  className="bg-orange-500/10 p-3 rounded-full text-orange-600 ml-2"><Navigation className="w-6 h-6"/></a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 行程區域：拖拽容器 */}
      <main className="px-6 mt-6">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={(currentDay.events || []).map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-6">
              {(currentDay.events || []).map((item: any) => (
                <SortableItem 
                  key={item.id} 
                  item={item} 
                  editingId={editingId} 
                  setEditingId={setEditingId} 
                  getIcon={getIcon} 
                  handleUpdate={handleUpdate} 
                  handleDelete={handleDelete} 
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </main>

      {/* 底部新增按鈕 */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex gap-3 bg-[#2D241E]/95 backdrop-blur-xl p-3 rounded-[35px] shadow-2xl border border-white/10 z-[100] scale-90">
        <button onClick={() => handleAdd('transport')} className="flex flex-col items-center gap-1 px-3">
          <div className="bg-blue-500 p-3 rounded-full text-white shadow-lg"><Car className="w-5 h-5"/></div>
          <span className="text-[9px] text-white font-bold">交通</span>
        </button>
        <button onClick={() => handleAdd('spot')} className="flex flex-col items-center gap-1 px-3">
          <div className="bg-orange-500 p-3 rounded-full text-white shadow-lg"><Castle className="w-5 h-5"/></div>
          <span className="text-[9px] text-white font-bold">景點</span>
        </button>
        <button onClick={() => handleAdd('food')} className="flex flex-col items-center gap-1 px-4">
          <div className="bg-green-500 p-3 rounded-full text-white shadow-lg"><UtensilsCrossed className="w-5 h-5"/></div>
          <span className="text-[9px] text-white font-bold">飲食</span>
        </button>
      </div>
    </div>
  );
}