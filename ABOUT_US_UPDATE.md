# About Us redesign — web and mobile

The public web About page and the mobile About EduPath screen now share the same detailed project story, purpose, mission, vision, six feature descriptions, three user groups, application journey, team credits, principles, FAQs and support guidance. The design uses EduPath's navy/gold palette, responsive cards and both light and dark themes.

## Team credits

| Creator | Assigned project role |
| --- | --- |
| Oseas Jamora | Project Lead & Systems Analyst |
| Archie Corre | Lead Developer |
| Jetro Ibaoc | UI/UX Designer |
| Devid Caballero | Quality Assurance & Testing |
| Sharmyn Novela | Research & Documentation Lead |

Roles were assigned as requested; the descriptions explain responsibilities rather than making unverifiable claims about qualifications, employment or accomplishments. Team artwork is clearly labelled as illustrative, not actual photographs or likenesses.

## Scope and preserved behavior

- `frontend/src/pages/About.jsx` replaces the former college photo gallery with the project story and team. The old photo assets and inactive duplicate source tree were retained; other pages were not restyled.
- `frontend/src/pages/About.css` scopes its styles to the About page and its artwork viewer. The viewer still supports enlargement, zoom, keyboard controls, Escape, focus handling and a fixed centered modal through the existing ModalPortal.
- `frontend/src/content/aboutEduPath.json` is the content source. Guest calls to action use registration/sign-in; signed-in accounts return to their own role's dashboard. Applicant and staff guide links point to existing routes.
- Mobile `lib/features/settings/screens/about_screen.dart` now includes the same content, jump links, expandable FAQs, artwork viewer, User Guide navigation and the existing Welcome Tour replay. Its route and constructor stay compatible with the Profile page.
- Mobile `lib/features/settings/about_content.dart` compiles the static content into the app, avoiding an unnecessary asynchronous loading step and keeping the page available offline.
- Mobile `pubspec.yaml` includes `assets/images/about/`. No dependencies were added.
- `frontend/scripts/build-mobile-about.mjs` regenerates the mobile content module from the web JSON. Run it with an explicit destination, for example `node frontend/scripts/build-mobile-about.mjs C:/Users/oseas/StudioProjects/edupath_mobile/lib/features/settings/about_content.dart`, then run `dart format` on that file.
- No backend, database, authentication, applicant decision rules, examination settings or other feature implementations were changed. Completing an exam is still described separately from official result release and scholarship decisions. No invented office email addresses, phone numbers, approval guarantees or institutional mission statements were added.

## Research used

The structure follows [Nielsen Norman Group's About Us research](https://www.nngroup.com/articles/about-us-information-on-websites/): explain the purpose plainly, identify the people behind the project and make the content clear and authentic. Image text alternatives and labelled artwork controls follow the [W3C WAI Images Tutorial](https://www.w3.org/WAI/tutorials/images/). EduPath feature descriptions come from the actual implemented project and existing workflows.

## Artwork record

The built-in imagegen tool generated one original collaboration illustration. It is saved in the project at:

- `frontend/src/assets/about-team/edupath-team.png`
- Mobile: `C:/Users/oseas/StudioProjects/edupath_mobile/assets/images/about/edupath-team.png`

The five symbolic avatars are distinct framed views of the five illustrated characters in this artwork, rendered by CSS/Flutter. They are not independently generated photographs. Following the user's instruction, no further image previews were sent in chat.

Final prompt used:

> Use case: illustration-story. Asset type: wide website and mobile About Us hero illustration for EduPath, an admission and scholarship management project for Trinidad Municipal College. Create an original premium editorial illustration of five young adult student project collaborators gathered around a desk with a laptop, a tablet, neat application folders and a small graduation cap motif. They are fictional illustrative characters, not likenesses of real people. Warm approachable atmosphere, clean shapes with subtle paper texture and dimensional shading, elegant academic navy #123B5D, warm gold #F4B400, muted teal and soft ivory. Wide landscape composition, balanced and uncluttered, all people comfortably within the frame, subtle abstract academic arch shapes behind them. No text, no letters, no numbers, no logos, no watermark. Do not portray a real campus or claim documentary accuracy. This is a polished illustration, not photography.

## Executed verification

- Production web build: passed.
- Full web lint: passed.
- Frontend suite: **74 tests passed**, including rendering the actual About page for guests, administrators, staff and applicants, checking team credits and role-specific destinations.
- Flutter About, existing Welcome Tour and User Guide suites: **18 tests passed**. Checks cover 320 px light/dark layouts with enlarged text, team jump navigation, FAQs, guide navigation/back, artwork viewer open/close, and tour replay without logging out or replacing the authenticated route.
- Final Flutter analyzer: **no issues found**.
- Full web/mobile content comparison: passed; team names, roles, descriptions, features, principles, journey, FAQs and avatar positions match. Artwork files also match.
- No connected browser or physical phone was available for visual click-through. Web compilation/rendering checks and Flutter widget/layout checks were executed; no browser-based verification is claimed.

Refresh the web page and hot-restart/relaunch Flutter to see the update. No database command is needed.
