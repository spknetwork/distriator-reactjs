import { type BusinessModel } from "../../types/business";

interface BusinessTrustedGuidesProps {
  business: BusinessModel;
}

export function BusinessTrustedGuides({ business }: BusinessTrustedGuidesProps) {
  const guides = business.distriator.guides || [];

  if (guides.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No trusted guides found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Guides</h2>

      {/* Horizontally scrollable container */}
      <div className="flex space-x-6 overflow-x-auto no-scrollbar py-2">
        {guides.map((guide, index) => {
          const percent = guide.percent / 100;

          let progressColor = "text-green-500";
          if (percent < 30) progressColor = "text-red-500";
          else if (percent < 60) progressColor = "text-yellow-500";
          else if (percent < 85) progressColor = "text-blue-500";

          return (
            <div
              key={index}
              className="flex flex-col items-center gap-2 p-2 bg-card rounded-lg hover:shadow-md transition min-w-[100px]"
            >
              {/* Avatar with radial progress and tooltip */}
              <div className="relative group" tabIndex={0}>
                <div
                  className={`radial-progress ${progressColor}`}
                  style={{
                    "--value": percent,
                    "--size": "5rem",
                    "--thickness": "4px",
                  } as React.CSSProperties}
                  aria-valuenow={percent}
                  role="progressbar"
                >
                  <img
                    src={`https://images.hive.blog/u/${guide.name}/avatar`}
                    alt={`${guide.name} avatar`}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                </div>

                {/* Tooltip centered above avatar */}
                <div className="absolute mb-2 left-1/2 transform -translate-x-1/2
                  px-2 py-1 rounded bg-black text-white text-xs whitespace-nowrap
                  opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100
                  pointer-events-none transition-opacity z-50">
                  {Math.round(percent)}%
                </div>
              </div>


              {/* Username below avatar */}
              <p className="font-semibold text-foreground text-center text-sm md:text-base truncate w-full">
                @{guide.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
