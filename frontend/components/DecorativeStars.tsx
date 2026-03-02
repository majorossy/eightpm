export default function DecorativeStars() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      <span className="absolute top-[15%] left-[10%] text-4xl md:text-6xl text-[var(--secondary)] opacity-40 hidden sm:block">
        &#9733;
      </span>
      <span className="absolute top-[20%] right-[15%] text-3xl md:text-5xl text-[var(--secondary)] opacity-30">
        &#9733;
      </span>
      <span className="absolute top-[60%] left-[5%] text-2xl md:text-4xl text-[var(--secondary)] opacity-25 hidden md:block">
        &#9733;
      </span>
      <span className="absolute top-[70%] right-[8%] text-3xl md:text-5xl text-[var(--secondary)] opacity-35 hidden sm:block">
        &#9733;
      </span>
      <span className="absolute top-[40%] left-[85%] text-xl md:text-3xl text-[var(--secondary)] opacity-20 hidden lg:block">
        &#9733;
      </span>
      <span className="absolute top-[85%] left-[20%] text-2xl md:text-4xl text-[var(--secondary)] opacity-30 hidden md:block">
        &#9733;
      </span>
    </div>
  );
}
