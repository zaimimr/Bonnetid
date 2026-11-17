import os, sys, json
sys.path.insert(0, os.path.expanduser('~/.agents/skills/claude-drawing/lib'))
import numpy as np
from lineart import LineArt

S, P, A, back, curl = LineArt.smooth, LineArt.poly, LineArt.arc, LineArt.retrace, LineArt.curl
EM, CREAM, GOLD, SUN, WATER = '#0C6B52', '#F1E9DA', '#E9B949', '#EBA53F', '#9FD3E0'


def f(v):
    return f'{v:.1f}'.rstrip('0').rstrip('.')


def pts_d(Q, close=False):
    return 'M' + ' '.join(f'{f(x)} {f(y)}' for x, y in Q) + ('Z' if close else '')


def build(parts, seed, at, scale, width=2.8, spans=None):
    la = LineArt(400, 240, seed=seed)
    parts = [LineArt.resample(np.asarray(q, np.float64) * scale + at, 1.0) for q in parts]
    Pth, _ = la.chain(parts)
    w, th = la.pressure(Pth, width=width * .66, taper=(10, 30), flick=4, ramp=10, spans=spans)
    n = np.stack([-np.sin(th), np.cos(th)], 1)
    L, R = Pth + n * (w[:, None] / 2), Pth - n * (w[:, None] / 2)
    outline = np.vstack([L[::2], L[-1:], R[::-1][::2], R[:1]])
    return pts_d(outline, True), pts_d(np.vstack([Pth[::3], Pth[-1:]])), float(LineArt.length(Pth))


def build_groups(groups, seed, at, scale):
    la = LineArt(400, 240, seed=seed)
    ds, cs, tot = [], [], 0.0
    for parts, width in groups:
        parts = [LineArt.resample(np.asarray(q, np.float64) * scale + at, 1.0) for q in parts]
        Pth, _ = la.chain(parts)
        if len(Pth) < 4:
            continue
        ln = float(LineArt.length(Pth))
        t = (min(8, ln * .2), min(20, ln * .3)) if width > 2 else (min(3, ln * .25), min(5, ln * .3))
        w, th = la.pressure(Pth, width=width * .7, taper=t, flick=min(4, ln * .1), ramp=min(10, ln * .2))
        n = np.stack([-np.sin(th), np.cos(th)], 1)
        L, R = Pth + n * (w[:, None] / 2), Pth - n * (w[:, None] / 2)
        ds.append(pts_d(np.vstack([L[::2], L[-1:], R[::-1][::2], R[:1]]), True))
        cs.append(pts_d(np.vstack([Pth[::2], Pth[-1:]])))
        tot += ln
    return ''.join(ds), ''.join(cs), tot


def inside(pts, poly):
    poly = np.asarray(poly, float)
    x, y = pts[:, 0], pts[:, 1]
    res = np.zeros(len(pts), bool)
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi, xj, yj = *poly[i], *poly[j]
        cross = ((yi > y) != (yj > y)) & (x < (xj - xi) * (y - yi) / (yj - yi + 1e-9) + xi)
        res ^= cross
        j = i
    return res


def clip_out(path, poly):
    path = LineArt.resample(np.asarray(path, float), 1.0)
    keep = ~inside(path, poly)
    runs, cur = [], []
    for pt, k in zip(path, keep):
        if k:
            cur.append(pt)
        elif cur:
            runs.append(np.array(cur)); cur = []
    if cur:
        runs.append(np.array(cur))
    return [r for r in runs if len(r) > 4]


UP = [(98, 54), (40, 59), (-20, 65), (-60, 73), (-104, 86)]
LO = [(-104, 86), (-50, 88), (10, 87), (60, 77), (100, 56)]


def swoosh_from(x):
    xs = [p[0] for p in UP][::-1]
    ys = [p[1] for p in UP][::-1]
    y = float(np.interp(x, xs, ys))
    up = [(x, y)] + [p for p in UP if p[0] < x - 8]
    return [S(up), S(LO)]


def ray_arc(cx, cy, r, a0, a1, rays, rl):
    out, cur = [], a0
    for a in sorted(rays, reverse=a1 < a0):
        out.append(A(cx, cy, r, a0=cur, a1=a))
        ca, sa = np.cos(np.radians(a)), np.sin(np.radians(a))
        out.append(back(P([(cx + r * ca, cy + r * sa), (cx + (r + rl) * ca, cy + (r + rl) * sa)], r=0)))
        cur = a
    out.append(A(cx, cy, r, a0=cur, a1=a1))
    return out


def beads(path, gap, r):
    L = LineArt.length(path)
    for s in np.arange(L - gap, gap * .6, -gap):
        path = curl(path, s, r, span=r * 1.2)
    return path


def leaf(bx, by, ang, ln, wd=.32):
    a = np.radians(ang)
    u, v = np.array([np.cos(a), np.sin(a)]), np.array([-np.sin(a), np.cos(a)])
    b = np.array([bx, by])
    q = lambda t, s: tuple(b + u * ln * t + v * ln * wd * s)
    return P([q(0, 0)], r=0) if ln == 0 else np.vstack([S([q(0, 0), q(.3, .9), q(.7, .7), q(1, 0)], per=14),
                                                         S([q(1, 0), q(.7, -.7), q(.3, -.9), q(0, 0)], per=14)])


def flap(x, y, sc, d, ink=EM):
    return (f'<g transform="translate({x} {y}) scale({sc})"><g class="a-soar" style="animation-delay:-{d * 4}s">'
            f'<path class="a-beat" style="animation-delay:-{d}s" d="M-12 -2Q-6 -8 0 0Q6 -8 12 -2" fill="none" stroke="{ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></g></g>')



def spark(x, y, r, d):
    return f'<path class="a-twinkle" style="animation-delay:{d}s" d="M{x} {y - r}Q{x} {y} {x + r} {y}Q{x} {y} {x} {y + r}Q{x} {y} {x - r} {y}Q{x} {y} {x} {y - r}Z" fill="{GOLD}"/>'


SC = {}

SC['morgen'] = dict(bg='#E8F2EE', parts=[
    A(0, 22, 44, a0=46, a1=-226), *swoosh_from(-32)],
    under=f'<path d="M30.6 53.7A44 44 0 1 0 -30.6 53.7Z" fill="{SUN}"/>',
    over=f'<path d="M-46.8 -5.0L-57.2 -11.0" stroke="{EM}" stroke-width="1.8" stroke-linecap="round"/><path d="M-27.0 -24.8L-33.0 -35.2" stroke="{EM}" stroke-width="1.8" stroke-linecap="round"/><path d="M0.0 -32.0L0.0 -44.0" stroke="{EM}" stroke-width="1.8" stroke-linecap="round"/><path d="M27.0 -24.8L33.0 -35.2" stroke="{EM}" stroke-width="1.8" stroke-linecap="round"/><path d="M46.8 -5.0L57.2 -11.0" stroke="{EM}" stroke-width="1.8" stroke-linecap="round"/>')

SC['kveld'] = dict(bg='#F8EAE0', parts=[
    A(0, 52, 56, a0=-4, a1=-184), *swoosh_from(-60), ],
    under=f'<g class="a-sink"><path d="M-48 54A48 48 0 0 1 48 54Z" fill="#E98A4F"/></g>',
    over=flap(70, -54, 1.6, 0) + flap(100, -30, 1.2, .3))

star = [(56 + (12 if i % 2 == 0 else 5) * np.cos(np.radians(-90 + 36 * i)), -44 + (12 if i % 2 == 0 else 5) * np.sin(np.radians(-90 + 36 * i))) for i in range(11)]
SC['sovn'] = dict(bg='#22355A', ink=CREAM, night=True, parts=[
    *[S(LO[::-1]), S(UP[::-1][:3] + [(10, 62)])], A(0, -4, 58, a0=60, a1=300), A(24, -10, 48, a0=293, a1=72)],
    under=f'<path class="a-glow" d="M21.4 -57.9A58 58 0 1 0 44.2 33.5A48 48 0 1 1 21.4 -57.9Z" fill="{GOLD}" fill-opacity=".8"/>',
    over='')

hand = [(-44, 70), (-46, 30), (-48, 8), (-58, -2), (-64, -12), (-60, -18), (-50, -12), (-50, -34), (-44, -50), (-32, -58), (-18, -56),
        (-9, -46), (-6, -24), (-6, 70)]
hl = LineArt.place(S(hand, per=10), (0, 0), 3, 1)
hr = LineArt.place(S([(-x, y) for x, y in hand][::-1], per=10), (0, 0), -3, 1)
SC['etterBonnen'] = dict(bg='#EDF5F1', parts=[hl, hr, *swoosh_from(48)],
    under=f'<g class="a-breathe"><circle cx="0" cy="-92" r="30" fill="{GOLD}" fill-opacity=".7"/></g><path d="{pts_d(hl, True)}" fill="#F3E3C0"/><path d="{pts_d(hr, True)}" fill="#F3E3C0"/>',
    over=''.join(f'<path d="M{x} {y0}V{y1}" transform="rotate({r})" stroke="{EM}" stroke-opacity=".45" stroke-width="1.5" stroke-linecap="round"/>' for x, y0, y1, r in [(-39, -48, -24, 3), (-28, -52, -26, 3), (-17, -48, -26, 3), (39, -48, -24, -3), (28, -52, -26, -3), (17, -48, -26, -3)])
         + spark(-30, -110, 5, 0) + spark(34, -118, 4, 1.2),
    at=(300, 132), scale=.9)

SC['etterBonnen2'] = SC['etterBonnen']

drape = [(10, 40), (-30, 22), (-62, 30), (-84, 8), (-66, -30), (-26, -52), (14, -60), (56, -46), (74, -8), (52, 30), (10, 40)]
dl = S(drape, per=22)
SC['etterBonnen1'] = dict(bg='#EDF5F1', parts=[beads(dl, 11.5, 4.2), P([(10, 40), (10, 50)], r=0), curl(P([(10, 50), (10, 70)], r=0), 4, 6, span=7),
    back(S([(10, 70), (6, 84), (0, 96)])), back(S([(10, 70), (10, 86), (11, 98)])), S([(10, 70), (15, 84), (21, 96)])],
    under=f'<circle cx="10" cy="54" r="7" fill="{GOLD}"/>', over='', at=(300, 112), scale=1.15)

C4 = np.array([(-112, 64), (44, 80), (100, 6), (-28, -8)], float)
def mat_pt(u, v):
    a, bb, c, d = C4
    return tuple((1 - v) * ((1 - u) * a + u * bb) + v * ((1 - u) * d + u * c))
arch_uv = [(.18, .12), (.18, .62), (.3, .76), (.5, .9), (.7, .76), (.82, .62), (.82, .12), (.18, .12)]
arch_pts = [mat_pt(u, v) for u, v in arch_uv]
mat_parts = [P([mat_pt(0, 0), mat_pt(0, 1), mat_pt(1, 1), mat_pt(1, 0), mat_pt(0, 0)], r=1.5, sharp=(1, 2, 3))]
for u in np.linspace(.06, .94, 9):
    mat_parts.append(back(P([mat_pt(u, 0), mat_pt(u, -.1)], r=0)))
SC['etterBonnen3'] = dict(bg='#EDF5F1', parts=[*mat_parts, P([mat_pt(.94, 0), mat_pt(.82, .12)], r=0), P(arch_pts[6:] + arch_pts[1:7], r=1.5, sharp=(1, 2, 4, 6))],
    under=f'<path d="{pts_d([mat_pt(0, 0), mat_pt(0, 1), mat_pt(1, 1), mat_pt(1, 0)], True)}" fill="#A9DABF"/><path d="{pts_d(arch_pts, True)}" fill="#F3CF6B" fill-opacity=".8"/>',
    over='', at=(300, 128), scale=.95)

SC['etterBonnen4'] = dict(bg='#EDF5F1', parts=[
    P([(-50, 64), (-50, -24)], r=0), S([(-50, -24), (-44, -56), (-24, -78), (0, -98)], per=14), back(P([(0, -98), (0, -44)], r=0)),
    S([(0, -98), (24, -78), (44, -56), (50, -24)], per=14), P([(50, -24), (50, 64)], r=0), *swoosh_from(50)],
    under=f'<path d="M-50 64V-24C-44 -56 -24 -78 0 -98C24 -78 44 -56 50 -24V64Z" fill="#F3CF6B" fill-opacity=".45"/><g class="a-breathe"><circle cx="0" cy="-30" r="26" fill="{GOLD}" fill-opacity=".6"/></g>',
    over=f'<path d="M-10 -44H10L6 -26C4 -18 -4 -18 -6 -26Z" fill="{GOLD}" stroke="{EM}" stroke-width="1.6" stroke-linejoin="round"/>',
    at=(296, 126), scale=.95)

tb = S([(-30, 12), (-14, 30), (-2, 50), (4, 66)], per=10)
SC['etterBonnen5'] = dict(bg='#EDF5F1', parts=[
    P([(-92, 64), (-92, 40), (70, 40), (70, 64), (-92, 64)], r=4, sharp=()), P([(-92, 40), (-86, 22), (64, 22), (70, 40)], r=4, sharp=()),
    P([(-86, 22), (-80, 6), (58, 6), (64, 22)], r=4, sharp=()), P([(58, 6), (-30, 6), (-30, 12)], r=0), beads(tb, 10, 3.6),
    curl(P([(4, 66), (4, 76)], r=0), 3, 5, span=6), back(S([(4, 76), (0, 88), (-4, 96)])), S([(4, 76), (8, 88), (12, 96)])],
    under=f'<path d="M-90 62V42H68V62Z" fill="#A9DABF"/><circle cx="4" cy="70" r="5" fill="{GOLD}"/>',
    over='', at=(296, 112), scale=1.15)

SC['etterBonnen'] = SC['etterBonnen3']
for k in ('etterBonnen1', 'etterBonnen2', 'etterBonnen3', 'etterBonnen4', 'etterBonnen5'):
    SC.pop(k)

SC['adhan'] = dict(bg='#E7EEF7', parts=[
    P([(-12, 62), (-12, -6), (-22, -10), (-21, -18), (-9, -18), (-9, -48)], r=1.2, sharp=(1, 2, 3, 4)),
    S([(-9, -48), (-15, -58), (-11, -72), (0, -84)], per=14), back(P([(0, -84), (0, -100)], r=0)),
    S([(0, -84), (11, -72), (15, -58), (9, -48)], per=14),
    P([(9, -48), (9, -18), (21, -18), (22, -10), (12, -6), (12, 62)], r=1.2, sharp=(1, 2, 3, 4)), *swoosh_from(12)],
    under='',
    over=f'<path class="a-glow" d="M4 -100a7 7 0 1 1 -5 -11a6 6 0 1 0 5 11z" fill="{GOLD}"/>'
         + ''.join(f'<path class="a-call" style="animation-delay:{d}s" d="M-26 -30A30 30 0 0 0 -26 2M26 -30A30 30 0 0 1 26 2" fill="none" stroke="{EM}" stroke-width="2" stroke-linecap="round"/>' for d in [0, 1.2, 2.4])
         + f'<path d="M-4 40V28A4 4 0 0 1 4 28V40" fill="none" stroke="{EM}" stroke-width="1.6"/>',
    spans=[(0, 170, .8)], at=(296, 128), scale=.98)


def sq(pts):
    return P(pts, r=.8, sharp=tuple(range(1, len(pts) - 1)))
spout_o = S([(-8, -50), (18, -48), (36, -36), (42, -18), (42, -4)], per=10)
spout_i = S([(24, -4), (24, -18), (16, -28), (-8, -30)], per=8)
tap = [P([(-90, -30), (-90, -50), (-8, -50)], r=.8, sharp=(1,)), spout_o, P([(42, -4), (24, -4)], r=0), spout_i, P([(-8, -30), (-90, -30)], r=0)]
drop = [(33, 8), (38, 18), (39, 24), (33, 31), (27, 24), (28, 18), (33, 8)]
lr = S([(22, 58), (38, 40), (40, 18), (30, 0), (14, -12), (12, -26)], per=14)
ll = S([(-12, -26), (-14, -12), (-30, 0), (-40, 18), (-38, 40), (-22, 58)], per=14)
rim = P([(12, -26), (18, -32), (-18, -32), (-12, -26)], r=.6, sharp=(1, 2))
spout = S([(34, 4), (52, -4), (64, -22), (72, -34), (77, -31), (68, -12), (56, 8), (39, 20)], per=10)
handle = S([(-14, -14), (-40, -18), (-52, 0), (-38, 24)], per=12)
knob = P([(-9, -32), (-6, -40), (6, -40), (9, -32)], r=.6, sharp=(1, 2))
SC['wudu'] = dict(bg='#E8F3F2', groups=[
    ([lr, rim, ll, *swoosh_from(-26)], 2.6), ([spout], 2.2), ([handle], 2.2), ([knob], 2.0)],
    under=f'<path d="{pts_d(np.vstack([lr, rim, ll]), True)}" fill="#F3CF6B"/><path d="{pts_d(spout, True)}" fill="#F3CF6B"/><path d="M-9 -32L-6 -40H6L9 -32Z" fill="#F3CF6B"/>',
    over='',
    at=(292, 116), scale=1.0)

N, T, K, B = (0, 0), (-150, -62), (-116, 2), (-130, 42)
plane = LineArt.place(P([K, B, N, K, T, N], r=2, sharp=(1, 2, 3, 4)), (96, -50), -16, .5)
trail = S([(-130, 82), (-90, 70), (-56, 44), (-30, 10), (0, -16), (24, -34), tuple(plane[0])])
trail = curl(trail, LineArt.locate(trail, (-40, 28)), 20, span=30, aspect=1.15)
SC['reise'] = dict(bg='#E3EDF7', parts=[trail, plane],
    under=f'<path d="{pts_d(LineArt.place([N, T, K], (96, -50), -16, .5), True)}" fill="{GOLD}" fill-opacity=".7"/>', over='',
    spans=[(0, 200, .65)])

tangle = S([(-140, 74), (-110, 66), (-86, 52), (-60, 56), (-40, 70), (-10, 62), (24, 44)])
tangle = curl(tangle, LineArt.locate(tangle, (-60, 56)), 11, span=16)
tangle = curl(tangle, LineArt.locate(tangle, (-100, 62)), 9, span=14, side=-1)
SC['bekymring'] = dict(bg='#F1EAF2', parts=[
    tangle, P([(24, 44)], r=0),
    S([(24, 44), (0, 20), (-16, -8), (-12, -36), (8, -48), (26, -40), (34, -26)], per=16),
    S([(34, -26), (44, -42), (64, -48), (82, -36), (84, -8), (66, 20), (34, 40)], per=16)],
    under=f'<path class="a-glow" d="M30 40C10 22 -10 0 -10 -24C-10 -40 4 -46 14 -44C24 -42 30 -34 34 -26C40 -38 50 -46 64 -44C78 -42 82 -28 80 -10C78 10 58 28 30 40Z" fill="#F0A493" fill-opacity=".75"/>',
    over='', spans=[(0, 160, .75)])

stem = [S([(0, -96), (-6, -60), (4, -24), (-2, 20), (4, 60)], per=20)]
sp = stem[0]
seq = []
marks = [(-60, 'L', -150, 40), (-36, 'R', -24, 44), (-6, 'L', -160, 38), (24, 'R', -10, 34)]
pos = [LineArt.locate(sp, (0, y)) for y, *_ in marks]
cuts = [0] + pos + [LineArt.length(sp)]
for i in range(len(marks)):
    seq.append(LineArt.trim(sp, cuts[i], cuts[i + 1]))
    pt = LineArt.at(sp, cuts[i + 1])[0]
    seq.append(leaf(pt[0], pt[1], marks[i][2], marks[i][3]))
seq.append(LineArt.trim(sp, cuts[-2], cuts[-1]))
SC['tilgivelse'] = dict(bg='#E7F2EA', parts=[back(leaf(0, -96, -80, 22)), *seq, *swoosh_from(4)],
    under=f'<path d="{pts_d(leaf(*LineArt.at(sp, pos[1])[0], -24, 44), True)}" fill="#9ACB8A" fill-opacity=".8"/>',
    over=f'<path class="a-leaf" d="M70 -40c7-7 16-5 18 0c-7 7-14 7-18 0z" fill="#D98B3A"/>')

tul = P([(0, -16), (-20, -26), (-26, -52), (-24, -84), (-10, -64), (0, -92), (10, -64), (24, -84), (26, -52), (20, -26), (0, -16)], r=1.4, sharp=(3, 4, 5, 6, 7))
SC['lovprisning'] = dict(bg='#F6F0DE', parts=[
    tul, S([(0, -16), (-4, 20), (2, 62)]), back(leaf(-2, 34, -140, 52, .22)), back(leaf(0, 14, -38, 46, .22)), *swoosh_from(2)],
    under=f'<path d="{pts_d(tul, True)}" fill="#EE9C8C" fill-opacity=".85"/>',
    over=flap(-70, -60, 1.5, 0) + flap(-40, -86, 1.1, .7) + flap(76, -70, 1.2, 1.4))

SC['koranen'] = dict(bg='#E4F0EA', parts=[
    S([(0, 34), (-28, 16), (-60, 14), (-92, 24)]), P([(-92, 24), (-98, -26)], r=0),
    S([(-98, -26), (-66, -38), (-30, -40), (0, -24)]), P([(0, -24), (0, 34)], r=0),
    S([(0, -24), (30, -40), (66, -38), (98, -26)]), P([(98, -26), (92, 24)], r=0),
    S([(92, 24), (60, 14), (28, 16), (0, 34)]),
    S([(0, 34), (-30, 24), (-62, 24), (-96, 34)]), back(P([(-96, 34), (-92, 24)], r=0)),
    S([(-96, 34), (-62, 24), (-30, 24), (0, 34)]),
    S([(0, 34), (30, 24), (62, 24), (96, 34)]), P([(96, 34), (92, 24)], r=0), *swoosh_from(-20)],
    under=f'<g class="a-breathe"><circle cx="0" cy="-58" r="36" fill="{GOLD}" fill-opacity=".6"/></g>',
    over=''.join(f'<path d="M{-86 + i * 2} {-18 + i * 10}Q-50 {-30 + i * 10} -12 {-14 + i * 10}M12 {-14 + i * 10}Q50 {-30 + i * 10} {86 - i * 2} {-18 + i * 10}" fill="none" stroke="{EM}" stroke-opacity=".4" stroke-width="1.6" stroke-linecap="round"/>' for i in range(4))
         + f'<path d="M6 -24C10 0 8 30 12 60L16 54L21 60C17 30 18 0 14 -26Z" fill="{GOLD}"/>')


dome_l = S([(-46, 12), (-52, -14), (-40, -40), (-16, -58), (0, -64)], per=14)
dome_r = S([(0, -64), (16, -58), (40, -40), (52, -14), (46, 12)], per=14)
SC['salawat'] = dict(bg='#EEF5EF', parts=[
    P([(96, 58), (96, -60), (88, -86), (80, -60), (80, 58), (52, 58), (52, 12), (46, 12)], r=1, sharp=(1, 2, 3)),
    dome_r[::-1], back(P([(0, -64), (0, -84)], r=0)), dome_l[::-1], P([(-46, 12), (-52, 12), (-52, 60)], r=1), *swoosh_from(-52)],
    under=f'<path d="{pts_d(np.vstack([dome_l, dome_r]))}Z" fill="#7FC4A0"/>',
    over=f'<path d="M3 -86a6 6 0 1 1 -4 -10a5 5 0 1 0 4 10z" fill="{GOLD}"/>')

path_l = S([(-110, 86), (-50, 66), (-10, 42), (2, 18), (18, -6)])
path_r = S([(62, -6), (58, 16), (48, 40), (70, 66), (122, 86)])
gate = [P([(18, -6), (18, -48)], r=0), S([(18, -48), (24, -68), (40, -86)], per=12), S([(40, -86), (56, -68), (62, -48)], per=12), P([(62, -48), (62, -6)], r=0)]
steps = [(-34, 76, 1.4), (-10, 62, 1.2), (8, 48, 1.05), (20, 34, .9), (28, 22, .78), (34, 12, .66), (38, 3, .55)]
SC['sunnah'] = dict(bg='#E7F0F6', parts=[path_l, *gate, path_r],
    under='<path d="M18 -6V-48C24 -68 40 -86 40 -86C40 -86 56 -68 62 -48V-6Z" fill="#F3CF6B"/>',
    over=''.join(f'<ellipse cx="{x + (-4 if i % 2 else 4) * s}" cy="{y}" rx="{3.4 * s}" ry="{5.6 * s}" fill="{EM}" fill-opacity=".55" transform="rotate(-24 {x} {y})"/>' for i, (x, y, s) in enumerate(steps)),
    at=(292, 122), scale=.95)

def crenels(x0, x1, y, n, h):
    w = (x1 - x0) / (2 * n - 1)
    out = []
    for i in range(2 * n - 1):
        xa, xb = x0 + i * w, x0 + (i + 1) * w
        yy = y - h if i % 2 == 0 else y
        out += [(xa, yy), (xb, yy)]
    return out
fort = [(18, 64), (70, 64), (70, -44)] + crenels(70, 40, -44, 3, 9) + [(40, -10)] + crenels(40, -40, -10, 5, 8) + [(-40, -44)] + crenels(-40, -70, -44, 3, 9) + [(-70, 64), (-18, 64)]
def shield(k):
    r = [(0, -66 * k + 6 * (1 - k)), (28 * k, -70 * k), (54 * k, -76 * k), (54 * k, -76 * k + 4), (54 * k, -20 * k), (48 * k, 16 * k), (32 * k, 44 * k), (0, 70 * k)]
    return r
def sh_side(k):
    r = shield(k)
    top = S(r[:3], per=10)
    side = S([r[3], r[4], r[5], r[6], r[7]], per=12)
    return top, side
t1, s1 = sh_side(1)
t2, s2 = sh_side(.8)
mir = lambda q: np.array([(-x, y) for x, y in q[::-1]])
out_pts = np.vstack([t1, s1, mir(s1), mir(t1)])
in_pts = np.vstack([t2, s2, mir(s2), mir(t2)])
SC['beskyttelse'] = dict(bg='#E3E8F4', groups=[
    ([mir(t1)[::-1][::-1], t1, s1, mir(s1)], 2.8),
    ([t2, s2, mir(s2), mir(t2)], 1.6),
    *[([q], 2.6) for q in swoosh_from(-56)]],
    under=f'<path d="{pts_d(out_pts, True)}" fill="#7FC4A0"/><path d="{pts_d(in_pts, True)}" fill="#A9DABF"/>',
    over='', at=(300, 112), scale=.95)

SC['ramadan'] = dict(bg='#ECE8F5', swing=True, parts=[
    P([(0, -170), (0, -96)], r=0), curl(P([(0, -96), (0, -76)], r=0), 4, 6, span=7),
    S([(0, -76), (14, -68), (22, -54)]), P([(22, -54), (36, -42), (36, 30), (20, 48), (0, 64)], r=3),
    back(P([(0, 64), (0, 80)], r=0)), P([(0, 64), (-20, 48), (-36, 30), (-36, -42), (-22, -54)], r=3), S([(-22, -54), (-14, -68), (0, -76)]),
    P([(0, -76), (-22, -54), (22, -54)], r=2), P([(22, -54), (-36, -42), (36, -42)], r=2)],
    under=f'<path class="a-win" d="M-18 34V-14A18 18 0 0 1 18 -14V34Z" fill="#F3CF6B"/>',
    over=f'<path d="M-56 -96A22 22 0 1 1 -56 -54A18 18 0 1 0 -56 -96Z" fill="{GOLD}" fill-opacity=".85" class="a-glow"/>', at=(296, 108), scale=.9)

SC['eid'] = dict(bg='#F7EEE6', parts=[
    back(S([(0, -16), (-14, -6), (-26, 4)])),
    S([(0, -16), (-22, -42), (-40, -36), (-30, -18), (0, -16)], per=14), S([(0, -16), (30, -18), (40, -36), (22, -42), (0, -16)], per=14),
    back(S([(0, -16), (14, -6), (26, 4)])), P([(0, -16), (0, 60), (44, 60), (44, 0), (50, 0), (50, -16), (-50, -16), (-50, 0), (-44, 0), (-44, 60)], r=1.5),
    *swoosh_from(-44)],
    under=f'<rect x="-43" y="1" width="86" height="58" fill="#F3CF6B" fill-opacity=".55"/>',
    over=spark(-80, -50, 9, 0) + spark(84, -60, 7, .8) + spark(-96, 6, 5, 1.6) + spark(100, -10, 6, 2.2))

Bb, Ab, Cb, Db, Eb, Fb, Gb = (0, 40), (-46, 24), (48, 22), (48, -44), (0, -26), (-46, -42), (4, -58)
SC['hajj'] = dict(bg='#F5EDDF', parts=[
    P([Bb, Ab, Fb, Eb, Fb, Gb, Db, Cb, Db, Eb, Bb, Cb], r=1.2, sharp=tuple(range(1, 11))),
    S([(48, 22), (76, 16), (104, 26), (100, 48), (60, 66), (0, 72), (-60, 66), (-104, 48), (-112, 30), (-92, 16)], per=18),
    S([(-92, 16), (-60, 52), (0, 60), (60, 54), (88, 34)], per=18)],
    under='<path d="M-46 -42L0 -26L48 -44L4 -58Z" fill="#E6D9BF"/>',
    over=f'<path d="M-46 -32L0 -16L48 -34L48 -27L0 -9L-46 -25Z" fill="{GOLD}"/>')

import re
CMAP = {'#F3CF6B': '#E6D8AC', '#E9B949': '#BF9C55', '#EBA53F': '#D3A462', '#A9DABF': '#D3E4DA', '#7FC4A0': '#AECDBB',
        '#D4E6EA': '#DDE6E8', '#9FD3E0': '#C3DBE1', '#F0A493': '#DDB9AE', '#EE9C8C': '#DDB9AE', '#E98A4F': '#D6A383',
        '#D98B3A': '#BF946A', '#9ACB8A': '#BACFB0', '#F3E3C0': '#ECE4D0', '#22355A': '#1F2B3D'}
def mute(h):
    for a, b in CMAP.items():
        h = h.replace(a, b)
    h = re.sub(r'<(path|ellipse)[^>]*class="a-(twinkle|ripple|call)"[^>]*/>', '', h)
    h = re.sub(r' class="a-(glow|breathe|beat|win|leaf)"', '', h)
    h = h.replace('stroke-width="1.8"', 'stroke-width="1.2"')
    return h
def calm_bg(hx):
    if hx in ('#22355A',):
        return '#1F2B3D'
    c = [int(hx[i:i + 2], 16) for i in (1, 3, 5)]
    n = (0xF3, 0xF4, 0xF1)
    return '#' + ''.join(f'{round(a * .35 + b * .65):02X}' for a, b in zip(c, n))
out = {}
for i, (k, sc) in enumerate(SC.items()):
    at, scale = np.array(sc.get('at', (300, 122))), sc.get('scale', .85) * .9
    sc = dict(sc, under=mute(sc['under']), over=mute(sc['over']), bg=calm_bg(sc['bg']))
    d, c, L = build_groups(sc['groups'], 7 + i, at, scale) if 'groups' in sc else build(sc['parts'], 7 + i, at, scale, spans=sc.get('spans'))
    g = lambda h: f'<g transform="translate({at[0]} {at[1]}) scale({scale})">{h}</g>' if h else ''
    out[k] = dict(bg=sc['bg'], ink=sc.get('ink', '#0E5A46') if not sc.get('night') else '#E9E4D8', night=sc.get('night', False), swing=sc.get('swing', False),
                  d=d, c=c, len=round(L), under=g(sc['under']), over=g(sc['over']))
    print(k, round(L))
open(sys.argv[1], 'w').write('const LINE=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
