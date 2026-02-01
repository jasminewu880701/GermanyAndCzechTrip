"use client";
import React, { useState, useEffect } from 'react';
import { MapPin, Sun, Plus, CloudRain, Sunset, Navigation, Hotel, Clock, Info, Save, Edit3, Trash2, Car, Castle, UtensilsCrossed, CheckCircle2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

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

export default function TravelApp() {
  const [selectedDate, setSelectedDate] = useState(DATES[0]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isEditAcc, setIsEditAcc] = useState(false);
  const [itineraries, setItineraries] = useState<any>({});

  const currentDay = itineraries[selectedDate] || { 
    events: [], 
    acc: { name: "", addr: "", checkIn: "", checkOut: "", laundry: false, kitchen: false, luggage: false } 
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('itineraries').select('*').eq('date', selectedDate).single();
      if (data) {
        setItineraries((prev: any) => ({ ...prev, [selectedDate]: data.events }));
      }
    };
    fetchData();
  }, [selectedDate]);

  const saveToDB = async (updatedData: any) => {
    await supabase.from('itineraries').upsert({ 
      date: selectedDate, 
      events_data: updatedData 
    }, { onConflict: 'date' });
  };

  const handleUpdateAcc = (field: string, value: any) => {
    const updatedDay = { ...currentDay, acc: { ...currentDay.acc, [field]: value } };
    setItineraries({ ...itineraries, [selectedDate]: updatedDay });
    saveToDB(updatedDay);
  };

  const handleAdd = async (type: string) => {
    const newId = Date.now();
    const newEvent = { id: newId, type, time: "12:00", start: "出發地", location: "目的地", note: "", info: "" };
    const updatedDay = { ...currentDay, events: [...(currentDay.events || []), newEvent] };
    setItineraries({ ...itineraries, [selectedDate]: updatedDay });
    setEditingId(newId);
    saveToDB(updatedDay);
  };

  const handleUpdateEvent = async (id: number, field: string, value: string) => {
    const updatedEvents = currentDay.events.map((e: any) => e.id === id ? { ...e, [field]: value } : e);
    const updatedDay = { ...currentDay, events: updatedEvents };
    setItineraries({ ...itineraries, [selectedDate]: updatedDay });
    saveToDB(updatedDay);
  };

  return (
    <div className="min-h-screen bg-[#FFFAF0] text-[#333] pb-40 font-sans antialiased">
      {/* 橫向日期選單 - 保持原樣 */}
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

      <div className="px-6 mt-4 space-y-3">
        {/* 天氣資訊 - 保持原樣 */}
        <div className="flex justify-around text-sm font-bold text-orange-700 opacity-80 mb-2">
          <div className="flex items-center gap-1.5"><Sun className="w-5 h-5"/> 2°C</div>
          <div className="flex items-center gap-1.5"><CloudRain className="w-5 h-5 text-blue-400"/> 15%</div>
          <div className="flex items-center gap-1.5"><Sunset className="w-5 h-5 text-orange-400"/> 17:35</div>
        </div>

        {/* 飯店資訊區 - 修正鉛筆與無框設計 */}
        <div className="py-2">
          {isEditAcc ? (
            <div className="bg-white p-5 rounded-3xl shadow-xl border border-orange-200 space-y-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-orange-500">編輯住宿資訊</span>
                <button onClick={() => setIsEditAcc(false)} className="text-orange-600"><Save className="w-6 h-6"/></button>
              </div>
              <input className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold" placeholder="飯店名稱" value={currentDay.acc?.name || ""} onChange={(e)=>handleUpdateAcc('name', e.target.value)} />
              <input className="w-full p-3 bg-gray-50 rounded-xl text-xs" placeholder="地址" value={currentDay.acc?.addr || ""} onChange={(e)=>handleUpdateAcc('addr', e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <input className="p-3 bg-gray-50 rounded-xl text-xs" placeholder="In (e.g. 15:00)" value={currentDay.acc?.checkIn || ""} onChange={(e)=>handleUpdateAcc('checkIn', e.target.value)} />
                <input className="p-3 bg-gray-50 rounded-xl text-xs" placeholder="Out (e.g. 11:00)" value={currentDay.acc?.checkOut || ""} onChange={(e)=>handleUpdateAcc('checkOut', e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {[{k:'laundry',l:'可洗衣服'},{k:'kitchen',l:'有廚房'},{k:'luggage',l:'可寄行李'}].map((i) => (
                  <button key={i.k} onClick={() => handleUpdateAcc(i.k, !currentDay.acc?.[i.k])}
                    className={`px-3 py-2 rounded-full text-[10px] font-bold ${currentDay.acc?.[i.k] ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
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
                  {/* 補上鉛筆按鈕 */}
                  <button onClick={() => setIsEditAcc(true)} className="text-orange-300 p-1"><Edit3 className="w-4 h-4"/></button>
                </div>
                {currentDay.acc?.name && (
                  <div className="ml-7 mt-1 space-y-1">
                    <p className="text-xs text-gray-400 truncate">{currentDay.acc?.addr}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
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

      {/* 行程區域 - 保持原樣 */}
      <main className="px-6 mt-6">
        <div className="space-y-6">
          {(currentDay.events || []).map((item: any) => (
            <div key={item.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-orange-50" onClick={() => setEditingId(item.id)}>
              {editingId === item.id ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><span className="text-xs font-bold text-orange-500 italic font-black">EDITING</span><button onClick={(e) => {e.stopPropagation(); setEditingId(null)}} className="text-orange-600"><Save className="w-6 h-6"/></button></div>
                  <input className="w-full p-4 bg-gray-50 rounded-2xl text-lg" value={item.time} onChange={(e) => handleUpdateEvent(item.id, 'time', e.target.value)} />
                  <input className="w-full p-4 bg-gray-50 rounded-2xl text-lg font-bold" value={item.location} onChange={(e) => handleUpdateEvent(item.id, 'location', e.target.value)} />
                  <textarea className="w-full p-4 bg-gray-50 rounded-2xl text-base h-24" value={item.note} onChange={(e) => handleUpdateEvent(item.id, 'note', e.target.value)} />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    {item.type === 'transport' ? <Car className="w-6 h-6 text-blue-500" /> : item.type === 'spot' ? <Castle className="w-6 h-6 text-orange-600" /> : <UtensilsCrossed className="w-6 h-6 text-green-600" />}
                    <span className="text-lg font-black text-orange-600">{item.time}</span>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 leading-tight mb-1">{item.location}</h3>
                  <div className="bg-[#FFF9F2] p-5 rounded-2xl mb-4 text-base text-gray-600 leading-relaxed whitespace-pre-line">{item.note}</div>
                  <div className="flex justify-end"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`} target="_blank" onClick={(e) => e.stopPropagation()} className="bg-orange-500 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-lg flex items-center gap-2"><Navigation className="w-4 h-4"/> 導航</a></div>
                </>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* 底部快速新增列 - 縮小版 */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex gap-3 bg-[#2D241E]/95 backdrop-blur-xl p-3 rounded-[35px] shadow-2xl border border-white/10 z-[100] scale-90">
        <button onClick={() => handleAdd('transport')} className="flex flex-col items-center gap-1 px-3">
          <div className="bg-blue-500 p-3 rounded-full text-white"><Car className="w-5 h-5"/></div>
          <span className="text-[9px] text-white font-bold">交通</span>
        </button>
        <button onClick={() => handleAdd('spot')} className="flex flex-col items-center gap-1 px-3">
          <div className="bg-orange-500 p-3 rounded-full text-white"><Castle className="w-5 h-5"/></div>
          <span className="text-[9px] text-white font-bold">景點</span>
        </button>
        <button onClick={() => handleAdd('food')} className="flex flex-col items-center gap-1 px-3">
          <div className="bg-green-500 p-3 rounded-full text-white"><UtensilsCrossed className="w-5 h-5"/></div>
          <span className="text-[9px] text-white font-bold">飲食</span>
        </button>
      </div>
    </div>
  );
}