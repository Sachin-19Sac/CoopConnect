import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { WorkerProfile, Skill } from '../../types';
import { Award, ShieldCheck, Plus, CheckCircle2, FileText, Sparkles, Power, MapPin, Star, Camera, Trash2, Briefcase } from 'lucide-react';

interface PortfolioImage {
  id: string;
  src: string;
  title: string;
}

const starterPortfolio: PortfolioImage[] = [
  { id: 'starter-1', src: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80', title: 'Complete home service' },
  { id: 'starter-2', src: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80', title: 'Precision repair work' },
  { id: 'starter-3', src: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80', title: 'Professional installation' },
];

export const WorkerSkills: React.FC = () => {
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState<number>(1);
  const [skillLevel, setSkillLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'>('ADVANCED');
  const [experienceYears, setExperienceYears] = useState<number>(4.0);
  const [portfolio, setPortfolio] = useState<PortfolioImage[]>(starterPortfolio);

  const loadSkills = async () => {
    try {
      const p = await api.getMyWorkerProfile();
      setProfile(p);
      const savedPortfolio = localStorage.getItem(`coopconnect_portfolio_${p.id}`);
      if (savedPortfolio) setPortfolio(JSON.parse(savedPortfolio));
      const sks = await api.getSkills();
      setAllSkills(sks);
      if (sks.length > 0) setSelectedSkillId(sks[0].id);
    } catch (err) {
      console.error('Failed to load skills bank', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const savePortfolio = (nextPortfolio: PortfolioImage[]) => {
    setPortfolio(nextPortfolio);
    if (profile) localStorage.setItem(`coopconnect_portfolio_${profile.id}`, JSON.stringify(nextPortfolio));
  };

  const handlePortfolioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).slice(0, 6 - portfolio.length);
    if (!files.length) return;

    Promise.all(files.map((file) => new Promise<PortfolioImage>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        id: `${file.name}-${file.lastModified}`,
        src: String(reader.result),
        title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      });
      reader.readAsDataURL(file);
    }))).then((uploads) => savePortfolio([...portfolio, ...uploads]));
    event.target.value = '';
  };

  const removePortfolioImage = (id: string) => savePortfolio(portfolio.filter((image) => image.id !== id));

  const handleAddSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addWorkerSkill({
        skill_id: selectedSkillId,
        skill_level: skillLevel,
        experience_years: experienceYears,
      });
      setShowAddSkill(false);
      await loadSkills();
    } catch (err: any) {
      alert(err.message || 'Failed to add skill');
    }
  };

  const handleToggleAvailability = async () => {
    if (!profile) return;
    const nextAvailability = profile.availability === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
    try {
      const updated = await api.toggleAvailability(nextAvailability);
      setProfile({ ...profile, availability: updated.availability });
    } catch (err: any) {
      alert(err.message || 'Failed to update duty status');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
        <div className="h-28 bg-[linear-gradient(115deg,#0f766e,#164e63_55%,#172033)] relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_80%_20%,white,transparent_35%)]" />
        </div>
        <div className="px-5 pb-6 sm:px-7">
          <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-slate-900 bg-emerald-500 text-3xl font-black text-slate-950 shadow-xl">
                {(profile?.user?.name || 'K').split(' ').map((part) => part[0]).slice(0, 2).join('')}
              </div>
              <div className="pb-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black text-white">{profile?.user?.name || 'Your professional profile'}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300"><ShieldCheck className="h-3 w-3" /> Verified</span>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-slate-400"><MapPin className="h-3.5 w-3.5 text-emerald-400" /> {profile?.location_name || 'Chennai'} · Serving nearby homes</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /><strong className="text-white">{profile?.average_rating || '4.8'}</strong> rating</span>
              <span><strong className="text-white">{profile?.experience_years || 0}</strong> yrs experience</span>
            </div>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-300">{profile?.bio || 'Skilled cooperative professional delivering dependable home services with clear communication, verified capabilities, and a focus on quality work.'}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {(profile?.skills || []).slice(0, 5).map((skill) => <span key={skill.id} className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300">{skill.skill?.name || 'Verified skill'}</span>)}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Customer rating', value: '4.9/5', detail: 'Based on recent home service jobs', icon: Star },
          { label: 'Response time', value: 'Within 30 min', detail: 'Fast scheduling for urgent fixes', icon: Briefcase },
          { label: 'Verified jobs', value: '200+', detail: 'Trusted cooperative service history', icon: Award },
        ].map(({ label, value, detail, icon: Icon }) => (
          <div key={label} className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
            <h3 className="mt-2 text-2xl font-black text-white">{value}</h3>
            <p className="mt-1 text-sm text-slate-400">{detail}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-emerald-400" /><h2 className="text-lg font-bold text-white">Recent work</h2></div>
            <p className="mt-1 text-xs text-slate-400">Show customers the quality and range of your completed work.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow hover:bg-emerald-400">
            <Camera className="h-4 w-4" /> Add work photos
            <input type="file" accept="image/*" multiple className="hidden" onChange={handlePortfolioUpload} disabled={portfolio.length >= 6} />
          </label>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {portfolio.map((image) => (
            <figure key={image.id} className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
              <img src={image.src} alt={image.title} className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-slate-950/95 to-transparent px-3 pb-3 pt-8 text-xs font-semibold capitalize text-white">
                <span className="truncate">{image.title}</span>
                <button type="button" title="Remove work photo" onClick={() => removePortfolioImage(image.id)} className="rounded-lg bg-slate-950/70 p-1.5 text-slate-300 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-slate-500">Up to 6 photos. Images are saved on this device for this demo.</p>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          <h2 className="text-lg font-bold text-white">What customers say</h2>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {[
            'Prompt communication, transparent pricing, and tidy workmanship. The team finished the job without any hassle.',
            'Very reliable and professional. Their work looked neat and they explained every step clearly before starting.',
          ].map((quote, index) => (
            <blockquote key={quote} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-300">
              <div className="mb-3 flex gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <Star key={`${quote}-${starIndex}`} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <p>“{quote}”</p>
              <footer className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {index === 0 ? 'Homeowner in Anna Nagar' : 'Customer in Velachery'}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-400 uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" /> ⭐ Dynamic Skill Bank
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Skills & Certifications</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Maintain your multi-tiered capabilities (Beginner to Expert) for fair match allocation.
          </p>
        </div>

        <button
          onClick={() => setShowAddSkill(!showAddSkill)}
          className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
        >
          <Plus className="w-4 h-4" /> Add New Skill
        </button>
        <button
          onClick={handleToggleAvailability}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
            profile?.availability === 'AVAILABLE'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
        >
          <Power className="w-4 h-4" />
          {profile?.availability === 'AVAILABLE' ? 'On Duty' : 'Off Duty'}
        </button>
      </div>

      {showAddSkill && (
        <form onSubmit={handleAddSkillSubmit} className="p-6 rounded-3xl bg-slate-900 border border-sky-500/30 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white">Register New Skill Capability</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Skill</label>
              <select
                value={selectedSkillId}
                onChange={(e) => setSelectedSkillId(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
              >
                {allSkills.map((sk) => (
                  <option key={sk.id} value={sk.id}>{sk.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Proficiency Level</label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="BEGINNER">Beginner (1-2 yrs)</option>
                <option value="INTERMEDIATE">Intermediate (2-4 yrs)</option>
                <option value="ADVANCED">Advanced (4-7 yrs)</option>
                <option value="EXPERT">Expert (7+ yrs)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Years of Practical Experience</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="30"
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddSkill(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-500 text-slate-950 text-xs font-bold"
            >
              Save to Skill Bank
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Verified Skill Matrix</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {profile?.skills.map((ws) => (
            <div key={ws.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-base">{ws.skill?.name || 'Skill'}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{ws.experience_years} years practical experience</p>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${
                  ws.skill_level === 'EXPERT'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : ws.skill_level === 'ADVANCED'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                }`}>
                  {ws.skill_level}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold pt-2 border-t border-slate-800">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Cooperative Capability
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Professional Certifications</h2>
            <p className="text-xs text-slate-400">Official trade credentials contributing 10% to allocation score</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {profile?.certifications.map((c) => (
            <div key={c.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-white text-sm">{c.name}</h4>
              </div>
              <p className="text-xs text-slate-400">{c.issuing_org}</p>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                <span>ID: {c.credential_id || 'VERIFIED'}</span>
                <span className="text-emerald-400 font-semibold">✓ Verified</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
