const AuthIllustration = () => {
  return (
    <div className="hidden min-h-full flex-col justify-between bg-linear-to-br from-emerald-500/10 via-emerald-400/5 to-transparent p-8 md:flex">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
          Sync · Rooms · Watch Together
        </p>
        <h3 className="mt-3 text-xl font-semibold text-neutral-50">
          Watch together, stay in rhythm.
        </h3>
        <p className="mt-2 text-sm text-neutral-200">
          Queue YouTube videos, chat in real time, and let Sync keep everyone perfectly aligned.
        </p>

        <ul className="mt-4 space-y-2 text-sm text-neutral-200">
          <li>• Host watch parties with friends in persistent rooms.</li>
          <li>• See who&apos;s in sync, buffering, or just joined.</li>
          <li>• Lock the queue or let everyone add to the vibe.</li>
        </ul>
      </div>

      <p className="text-xs text-neutral-400">
        Built for real-time collaboration — perfect for study sessions, hangouts, or concerts at home.
      </p>
    </div>
  );
};

export default AuthIllustration;

