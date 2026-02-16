import React from 'react';
import { 
  Users, Package, Truck, CheckCircle, AlertCircle, Clock, TrendingUp, 
  ArrowUpRight, ArrowDownRight, Activity, MapPin 
} from 'lucide-react';
import { Courier, Shipment } from './types';

interface OverviewProps {
  couriers: Courier[];
  shipments: Shipment[];
  onNavigate: (page: string) => void;
}

const Overview: React.FC<OverviewProps> = ({ couriers, shipments, onNavigate }) => {
  const activeCouriers = couriers.filter(c => c.status === 'active' || c.status === 'on-delivery').length;
  const inTransit = shipments.filter(s => s.status === 'in-transit' || s.status === 'out-for-delivery').length;
  const delivered = shipments.filter(s => s.status === 'delivered').length;
  const pending = shipments.filter(s => s.status === 'pending').length;
  const paused = shipments.filter(s => s.isPaused).length;

  const stats = [
    { label: 'Total Couriers', value: couriers.length.toString(), icon: <Users size={22} />, change: '+3 this week', up: true, color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Shipments', value: inTransit.toString(), icon: <Truck size={22} />, change: '+12 today', up: true, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Delivered', value: delivered.toString(), icon: <CheckCircle size={22} />, change: '+8 today', up: true, color: 'bg-green-50 text-green-600' },
    { label: 'Pending Pickup', value: pending.toString(), icon: <Clock size={22} />, change: 'Needs attention', up: false, color: 'bg-amber-50 text-amber-600' },
  ];

  const recentActivity = [
    { text: 'Courier Marcus Johnson picked up shipment AT-8842-X9', time: '5 min ago', type: 'pickup' },
    { text: 'Shipment AT-3291-K4 is out for delivery in Chicago', time: '12 min ago', type: 'delivery' },
    { text: 'New courier Sofia Martinez registered', time: '1 hour ago', type: 'register' },
    { text: 'Shipment AT-6645-Z1 paused — awaiting clearance', time: '2 hours ago', type: 'alert' },
    { text: 'Shipment AT-1198-B7 delivered successfully', time: '3 hours ago', type: 'complete' },
    { text: 'Courier David Okafor completed 891st delivery', time: '4 hours ago', type: 'milestone' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-5 sm:p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2.5 rounded-lg ${stat.color}`}>{stat.icon}</div>
              <span className={`text-xs font-medium flex items-center gap-0.5 ${stat.up ? 'text-green-600' : 'text-amber-600'}`}>
                {stat.up ? <ArrowUpRight size={14} /> : <AlertCircle size={14} />}
                {stat.change}
              </span>
            </div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{stat.label}</h3>
            <p className="text-2xl sm:text-3xl font-bold text-[#0a192f]">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-100 shadow-sm">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-[#0a192f] flex items-center gap-2"><Activity size={18} /> Recent Activity</h2>
            <span className="text-xs text-gray-400">Live</span>
          </div>
          <div className="divide-y divide-gray-50">
            {recentActivity.map((item, i) => (
              <div key={i} className="px-5 sm:px-6 py-4 flex items-start gap-3 hover:bg-gray-50/50 transition-colors">
                <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                  item.type === 'alert' ? 'bg-amber-500' :
                  item.type === 'complete' ? 'bg-green-500' :
                  item.type === 'delivery' ? 'bg-blue-500' :
                  item.type === 'register' ? 'bg-purple-500' :
                  item.type === 'milestone' ? 'bg-emerald-500' :
                  'bg-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{item.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions + Active Couriers */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5 sm:p-6">
            <h2 className="font-bold text-[#0a192f] mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button onClick={() => onNavigate('couriers')} className="w-full text-left px-4 py-3 bg-[#0a192f] text-white text-sm font-medium rounded-lg hover:bg-[#112d57] transition-colors flex items-center gap-2">
                <Users size={16} /> Register New Courier
              </button>
              <button onClick={() => onNavigate('shipments')} className="w-full text-left px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2">
                <Package size={16} /> Create Shipment
              </button>
              <button onClick={() => onNavigate('track-map')} className="w-full text-left px-4 py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <MapPin size={16} /> View Live Map
              </button>
            </div>
          </div>

          {/* Paused Shipments Alert */}
          {paused > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={18} className="text-amber-600" />
                <h3 className="font-semibold text-amber-800 text-sm">Paused Shipments</h3>
              </div>
              <p className="text-xs text-amber-700 mb-3">{paused} shipment(s) currently paused and need attention.</p>
              <button onClick={() => onNavigate('track-map')} className="text-xs font-medium text-amber-800 underline hover:no-underline">
                View on Map →
              </button>
            </div>
          )}

          {/* Top Couriers */}
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5 sm:p-6">
            <h2 className="font-bold text-[#0a192f] mb-4 flex items-center gap-2">
              <TrendingUp size={18} /> Top Couriers
            </h2>
            <div className="space-y-3">
              {[...couriers].sort((a, b) => b.totalDeliveries - a.totalDeliveries).slice(0, 3).map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <img src={c.avatar} alt={c.name} className="w-9 h-9 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0a192f] truncate">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.totalDeliveries} deliveries</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-yellow-600 font-medium">
                    ★ {c.rating}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
