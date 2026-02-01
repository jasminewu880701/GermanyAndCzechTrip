import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
// 在 GermanyTripApp 組件內部修改

export default function TravelApp() {

  // ... 其他狀態設定 ...



  // 當選擇日期時，從資料庫抓取資料

  useEffect(() => {

    const fetchData = async () => {

      let { data } = await supabase

        .from('itineraries')

        .select('*')

        .eq('date', selectedDate)

        .single();

      

      if (data) {

        setItineraries((prev: any) => ({ ...prev, [selectedDate]: data.events }));

      }

    };

    fetchData();

  }, [selectedDate]);



  // 當儲存編輯時，同步回傳資料庫

  const saveToDB = async (updatedDay: any) => {

    const { error } = await supabase

      .from('itineraries')

      .upsert({ date: selectedDate, events: updatedDay });

    

    if (error) alert("同步失敗：" + error.message);

  };



  // 修改 handleUpdate，在最後呼叫 saveToDB

  const handleUpdate = (id: number, field: string, value: string) => {

    const updatedEvents = currentDay.events.map((e: any) => e.id === id ? { ...e, [field]: value } : e);

    const updatedDay = { ...currentDay, events: updatedEvents };

    setItineraries({ ...itineraries, [selectedDate]: updatedDay });

    saveToDB(updatedDay); // 這裡會把內容存進資料庫

  };
"use client";
import React, { useState } from 'react';
import { MapPin, Sun, Plus, CloudRain, Sunset, Navigation, Hotel, Clock, Info, Save, Edit3, Trash2, Car, Castle, UtensilsCrossed } from 'lucide-react';

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
  
  // 初始範例資料
  const [itineraries, setItineraries] = useState<any>({
    "2026-02-14": {
      acc: null,
      events: [{ id: 1, type: 'transport', time: "21:15 ~ 23:25", start: "台北 TPE T1", location: "香港 HKG T1", note: "國泰航空 CX479", info: "" }]
    },
    "2026-02-15": {
      acc: { name: "Staycity Frankfurt Airport", addr: "Amelia-Mary-Earhart-Straße 9, Frankfurt" },
      events: [{ id: 2, type: 'transport', time: "00:25 ~ 07:05", start: "香港 HKG T1", location: "法蘭克福 FRA T2", note: "漢莎航空 LH7015", info: "飯店在機場旁" }]
    }
  });

  const currentDay = itineraries[selectedDate] || { events: [] };

  const getIcon = (type: string) => {
    switch(type) {
      case 'transport': return <Car className="w-6 h-6 text-blue-500" />;
      case 'spot': return <Castle className="w-6 h-6 text-orange-600" />;
      case 'food': return <UtensilsCrossed className="w-6 h-6 text-green-600" />;
      default: return <MapPin className="w-6 h-6 text-gray-400" />;
    }
  };

  const handleAdd = (type: string) => {
    const newId = Date.now();
    const newEvent = { id: newId, type, time: "12:00", start: "出發地", location: "目的地", note: "", info: "" };
    const updatedDay = { ...currentDay, events: [...currentDay.events, newEvent] };
    setItineraries({ ...itineraries, [selectedDate]: updatedDay });
    setEditingId(newId);
  };

  // --- 修正後的刪除函數 ---
  const handleDelete = (id: number) => {
    if (confirm("確定要刪除這筆行程嗎？")) {
      const updatedEvents = currentDay.events.filter((e: any) => e.id !== id);
      setItineraries({ 
        ...itineraries, 
        [selectedDate]: { ...currentDay, events: updatedEvents } 
      });
      setEditingId(null); // 刪除後關閉編輯模式
    }
  };

  const handleUpdate = (id: number, field: string, value: string) => {
    const updatedEvents = currentDay.events.map((e: any) => e.id === id ? { ...e, [field]: value } : e);
    setItineraries({ ...itineraries, [selectedDate]: { ...currentDay, events: updatedEvents } });
  };

  return (
    <div className="min-h-screen bg-[#FFFAF0] text-[#333] pb-32 font-sans">
      {/* 橫向日期滑動選單 */}
      <div className="sticky top-0 z-50 bg-[#FFFAF0]/95 backdrop-blur-md border-b border-orange-100">
        <div className="flex overflow-x-auto py-5 px-4 gap-4 no-scrollbar">
          {DATES.map((date, idx) => (
            <button key={date} onClick={() => setSelectedDate(date)}
              className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${
                selectedDate === date ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-orange-800'
              }`}>
              <span className="text-[10px] font-bold text-center">Day {idx + 1}</span>
              <span className="text-xl font-black">{date.split('-')[1]}/{date.split('-')[2]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 天氣與飯店資訊 */}
      <div className="px-6 mt-4 space-y-3">
        <div className="flex justify-around text-sm font-bold text-orange-700 opacity-80">
          <div className="flex items-center gap-1.5"><Sun className="w-5 h-5"/> 2°C</div>
          <div className="flex items-center gap-1.5"><CloudRain className="w-5 h-5 text-blue-400"/> 15%</div>
          <div className="flex items-center gap-1.5"><Sunset className="w-5 h-5 text-orange-400"/> 17:35</div>
        </div>

        {currentDay.acc && (
          <div className="flex justify-between items-center py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2"><Hotel className="w-5 h-5 text-orange-500"/><span className="text-base font-black truncate text-gray-800">{currentDay.acc.name}</span></div>
              <p className="text-xs text-gray-400 truncate ml-7">{currentDay.acc.addr}</p>
            </div>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentDay.acc.addr)}`} target="_blank"
              className="bg-orange-500/10 p-3 rounded-full text-orange-600"><Navigation className="w-6 h-6"/></a>
          </div>
        )}
      </div>

      {/* 行程區域 */}
      <main className="px-6 mt-6">
        <div className="space-y-6">
          {currentDay.events.map((item: any) => (
            <div key={item.id} className="relative">
              {editingId === item.id ? (
                <div className="bg-white p-6 rounded-3xl shadow-xl space-y-4 border border-orange-200">
                  <div className="flex justify-between items-center"><span className="text-xs font-bold text-orange-500 italic">編輯中...</span><button onClick={() => setEditingId(null)} className="text-orange-600 bg-orange-50 p-2 rounded-full"><Save className="w-6 h-6"/></button></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 ml-1">時間</label>
                  <input className="w-full p-4 bg-gray-50 rounded-2xl text-lg" value={item.time} onChange={(e) => handleUpdate(item.id, 'time', e.target.value)} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 ml-1">出發地</label>
                  <input className="w-full p-4 bg-gray-50 rounded-2xl text-lg" value={item.start} onChange={(e) => handleUpdate(item.id, 'start', e.target.value)} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 ml-1">目的地</label>
                  <input className="w-full p-4 bg-gray-50 rounded-2xl text-lg font-bold" value={item.location} onChange={(e) => handleUpdate(item.id, 'location', e.target.value)} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 ml-1">備註/轉乘細節</label>
                  <textarea className="w-full p-4 bg-gray-50 rounded-2xl text-base h-24" value={item.note} onChange={(e) => handleUpdate(item.id, 'note', e.target.value)} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-orange-400 ml-1">景點攻略</label>
                  <textarea className="w-full p-4 bg-orange-50/50 rounded-2xl text-sm h-32" value={item.info} onChange={(e) => handleUpdate(item.id, 'info', e.target.value)} /></div>
                  
                  {/* 修正後的刪除按鈕 */}
                  <button 
                    onClick={() => handleDelete(item.id)} 
                    className="w-full py-4 mt-2 text-red-500 font-bold flex items-center justify-center gap-2 bg-red-50 rounded-2xl"
                  >
                    <Trash2 className="w-5 h-5"/> 刪除此行程
                  </button>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-[32px] shadow-sm active:scale-95 transition-transform" onClick={() => setEditingId(item.id)}>
                  <div className="flex items-center gap-3 mb-3">
                    {getIcon(item.type)}
                    <span className="text-lg font-black text-orange-600">{item.time}</span>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 leading-tight mb-1">{item.location}</h3>
                  <p className="text-sm text-gray-400 font-medium mb-4 flex items-center gap-1"><MapPin className="w-4 h-4"/> {item.start}</p>
                  
                  <div className="bg-[#FFF9F2] p-5 rounded-2xl mb-4">
                    <p className="text-base text-gray-600 leading-relaxed whitespace-pre-line">{item.note}</p>
                  </div>

                  {item.info && (
                    <div className="mb-5 p-5 bg-orange-50/30 border-l-4 border-orange-200 rounded-r-xl">
                      <div className="flex items-center gap-1 text-orange-600 text-sm font-black mb-1"><Info className="w-5 h-5"/> 攻略資訊</div>
                      <p className="text-sm text-gray-500 italic leading-relaxed">{item.info}</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`} target="_blank" onClick={(e) => e.stopPropagation()}
                      className="bg-orange-500 text-white px-8 py-4 rounded-2xl text-base font-black shadow-lg flex items-center gap-2">
                      <Navigation className="w-5 h-5"/> 導航
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* 手機專用底部快速新增列 */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4 bg-[#2D241E]/95 backdrop-blur-xl p-4 rounded-[40px] shadow-2xl border border-white/10 z-[100]">
        <button onClick={() => handleAdd('transport')} className="flex flex-col items-center gap-1 px-4">
          <div className="bg-blue-500 p-3.5 rounded-full text-white shadow-lg"><Car className="w-7 h-7"/></div>
          <span className="text-[11px] text-white font-bold">交通</span>
        </button>
        <button onClick={() => handleAdd('spot')} className="flex flex-col items-center gap-1 px-4">
          <div className="bg-orange-500 p-3.5 rounded-full text-white shadow-lg"><Castle className="w-7 h-7"/></div>
          <span className="text-[11px] text-white font-bold">景點</span>
        </button>
        <button onClick={() => handleAdd('food')} className="flex flex-col items-center gap-1 px-4">
          <div className="bg-green-500 p-3.5 rounded-full text-white shadow-lg"><UtensilsCrossed className="w-7 h-7"/></div>
          <span className="text-[11px] text-white font-bold">飲食</span>
        </button>
      </div>
    </div>
  );
}
}